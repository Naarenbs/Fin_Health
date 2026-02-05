from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import BytesIO
from typing import List  
from openai import OpenAI
from db import SessionLocal, Report
import os

# --- 1. CONFIGURATION ---
# Use your environment variable or hardcode it here
GROQ_API_KEY = "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"

if not GROQ_API_KEY:
    raise RuntimeError("Missing API key. Set GROQ_API_KEY.")

# Initialize Groq Client
client = OpenAI(
    api_key=GROQ_API_KEY, 
    base_url="https://api.groq.com/openai/v1"
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. ANALYZE ENDPOINT ---
@app.post("/analyze")
async def analyze_financials(files: List[UploadFile] = File(...)):
    try:
        all_dataframes = []

        # A. LOOP THROUGH FILES
        for file in files:
            contents = await file.read()
            filename = file.filename.lower()
            
            # Robust Reading Logic
            if filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(BytesIO(contents))
            else:
                # Try UTF-8 first, fallback to ISO-8859-1 (for Windows Excel CSVs)
                try:
                    df = pd.read_csv(BytesIO(contents), encoding='utf-8')
                except UnicodeDecodeError:
                    print(f"UTF-8 failed for {filename}, trying ISO-8859-1...")
                    df = pd.read_csv(BytesIO(contents), encoding='ISO-8859-1')
            
            all_dataframes.append(df)

        if not all_dataframes:
            return {"error": "No valid files found"}
            
        combined_df = pd.concat(all_dataframes, ignore_index=True)

        # B. CLEAN & CALCULATE
        combined_df.columns = combined_df.columns.str.strip().str.title()
        
        # Validation
        if 'Type' not in combined_df.columns or 'Amount' not in combined_df.columns:
             return {"error": "CSV must have 'Type' and 'Amount' columns"}

        # ⚠️ FIX: Force convert to simple Python 'float' immediately
        _rev = combined_df[combined_df['Type'].str.title() == 'Income']['Amount'].sum()
        _exp = combined_df[combined_df['Type'].str.title() == 'Expense']['Amount'].sum()
        
        total_revenue = float(_rev)
        total_expenses = float(_exp)
        net_profit = float(total_revenue - total_expenses)
        
        margin = 0.0
        if total_revenue > 0:
            margin = (net_profit / total_revenue) * 100
        margin = float(round(margin, 2))  # Ensure this is a float too!

        status = "Healthy" if margin > 20 else "Critical"

        # C. ASK THE AI (Groq)
        ai_advice = "Analysis pending..."
        try:
            prompt = f"""
            Act as a CFO. Analyze this consolidated financial data from multiple sources:
            - Revenue: ${total_revenue}
            - Expenses: ${total_expenses}
            - Net Profit: ${net_profit}
            - Margin: {margin:.2f}%
            
            Provide:
            1. Health assessment.
            2. 3 Recommendations.
            3. Risk warning.
            Keep it professional and concise.
            """
            
            # ✅ FIXED: Using the working model and standard chat syntax
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant", 
                messages=[
                    {"role": "system", "content": "You are a helpful financial CFO."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )

            # ✅ FIXED: Correct way to extract text
            ai_advice = completion.choices[0].message.content

        except Exception as ai_error:
            error_msg = str(ai_error)
            print(f"Groq API Error: {error_msg}")
            ai_advice = f"Financial Analysis:\n- Revenue: ${total_revenue:,.2f}\n- Expenses: ${total_expenses:,.2f}\n- Net Profit: ${net_profit:,.2f}\n- Margin: {margin:.2f}%\n\n⚠️ AI analysis unavailable. Error: {error_msg}"

        # D. SAVE TO DB (Now using clean floats)
        report_id = -1
        try:
            db = SessionLocal()
            report_obj = Report(
                file_count=len(files),
                revenue=total_revenue,    # Already a float
                expenses=total_expenses,  # Already a float
                net_profit=net_profit,    # Already a float
                margin=margin,            # Already a float
                health_status=status,
                ai_analysis=ai_advice,
            )
            db.add(report_obj)
            db.commit()
            db.refresh(report_obj)
            report_id = report_obj.id
            db.close()
        except Exception as db_error:
            print("DB Error:", db_error)
            pass

        # E. RETURN RESULT
        return {
            "status": "Success",
            "report_id": report_id,
            "file_count": len(files),
            "revenue": float(total_revenue),
            "expenses": float(total_expenses),
            "net_profit": float(net_profit),
            "margin": round(margin, 2),
            "health_status": status,
            "ai_analysis": ai_advice
        }

    except Exception as e:
        print("CRITICAL ERROR:", e)
        return {"error": str(e)}

# --- 3. REPORTS ENDPOINTS ---
@app.get("/reports")
def list_reports(limit: int = 20):
    db = SessionLocal()
    try:
        rows = db.query(Report).order_by(Report.created_at.desc()).limit(limit).all()
        return rows
    finally:
        db.close()

@app.get("/reports/{report_id}")
def get_report(report_id: int):
    db = SessionLocal()
    try:
        r = db.query(Report).filter(Report.id == report_id).first()
        if not r:
            raise HTTPException(status_code=404, detail="Report not found")
        return r
    finally:
        db.close()