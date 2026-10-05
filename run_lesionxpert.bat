@echo off
title lesionXpert.AI Server
cls
echo ======================================================================
echo    lesionXpert.AI - Clinical Diagnostic & Educational Suite
echo ======================================================================
echo.
echo Starting Streamlit server on http://localhost:8501 ...
echo.
python -m streamlit run streamlit_app.py --server.port 8501 --server.address 0.0.0.0
pause
