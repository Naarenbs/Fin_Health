# 🚀 FinHealth.ai

### Your AI-Powered Fractional CFO
**Turn messy financial spreadsheets into actionable strategic insights in seconds.**

[**🔴 LIVE DEMO**](https://fin-health-orcin.vercel.app/) | [**📺 WATCH VIDEO**](https://www.loom.com/share/4a1744164c494eaba3126c39fd5c14c6)

---

## 💡 The Problem
Small business owners drown in spreadsheets. They have "January.csv", "February.xlsx", and "March_v2.csv", but they don't know their **true** year-to-date profit or what strategic moves to make next. Hiring a CFO is too expensive ($5,000+/mo), and standard tools like Excel are static and dumb.

## 🤖 The Solution
**FinHealth.ai** is an intelligent financial dashboard that:
1.  **Consolidates Data:** Accepts multiple files (Excel & CSV) at once and merges them into a single financial truth.
2.  **Analyzes Instantly:** Uses **Llama-3.1 (via Groq)** to act as a Virtual CFO, providing health assessments, risk warnings, and growth recommendations.
3.  **Remembers Everything:** Built on a "Zero-Click Save" architecture that auto-archives every report to a secure database.

---

## ✨ Key Features

* **📂 Multi-File Consolidation:** Drag & drop 1 or 10 files simultaneously. The engine detects headers, merges datasets, and handles different file encodings (UTF-8 vs Windows-1252) automatically.
* **🧠 Generative AI Analysis:** Integrated with **Groq (Llama-3.1-8b)** to generate human-like financial advice, calculating margins and flagging anomalies in real-time.
* **💾 Auto-Save Architecture:** No "Save" button needed. Every analysis is instantly committed to our **SQLite** database, accessible via the "Past Reports" history tab.
* **📊 Interactive Visuals:** Dynamic Pie Charts (Recharts) showing cash flow distribution with interactive tooltips.
* **🌗 Adaptive UI:** Fully responsive design with automatic Dark/Light mode detection based on system preferences.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React (Vite)
* **Styling:** CSS Modules with Glassmorphism effects
* **Charts:** Recharts
* **Icons:** Lucide-React
* **State Management:** React Hooks

### **Backend**
* **Framework:** FastAPI (Python)
* **Data Processing:** Pandas (NumPy)
* **AI Engine:** Groq API (Llama-3.1-8b-instant)
* **Database:** SQLite (SQLAlchemy ORM)
* **Validation:** Pydantic

---

## 📸 Screenshots

*(Add screenshots of your Dashboard and History page here)*

---

## 🚀 How to Run Locally

### Prerequisites
* Node.js (v16+)
* Python (v3.10+)

### 1. Clone the Repo
```bash
git clone [https://github.com/your-username/finhealth-ai.git](https://github.com/your-username/finhealth-ai.git)
cd finhealth-ai
2. Setup Backend
cd backend
pip install -r requirements.txt
# Create a .env file and add: GROQ_API_KEY=your_key_here
uvicorn main:app --reload

3. Setup Frontend
cd frontend
npm install
npm run dev
