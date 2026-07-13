FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# This ensures fraud_model.pkl is packaged into the container
COPY . . 
CMD ["python", "main.py"]