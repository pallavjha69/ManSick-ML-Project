import joblib
from fastapi import FastAPI
from pydantic import BaseModel , Field
import pandas as pd
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware


#pydantic model 
class StudentData(BaseModel):    #this is used for data validation
    age                     : int = Field(..., gt=0, description="Age must be a positive integer")
    gender                  : str = Literal['Male', 'Female', 'Other'] 
    country                 : str = "Unknown"
    academic_level          : str = Literal['Undergraduate', 'Graduate', 'High School' ]
    most_used_platform      : str = Literal[ 'Facebook',  'LinkedIn', 'Instagram',  'Snapchat',   'Twitter',   'YouTube',
                                                'TikTok',      'LINE', 'KakaoTalk', 'VKontakte',  'WhatsApp',    'WeChat']
    purpose_of_use          : str = Literal['Networking', 'Education', 'Entertainment', 'News']
    avg_daily_usage_hours   : float = Field(..., ge=0, le=24, description="Average daily usage hours must be between 6 and 24")
    daily_unlocks           : int   = Field(..., ge=0, description="Daily unlocks must be a non-negative number")  
    study_hours             : float = Field(..., ge=0, le=24)
    physical_activity_hours : float = Field(..., ge=0, le=24)
    sleep_hours_per_night   : float = Field(..., ge=0, le=24)
    stress_level : str = Literal['Medium', 'Low', 'High', 'Very High']

    

model = joblib.load('ManSick.pkl')
app = FastAPI()

app.add_middleware(        #this acts between the frontend and backend of the application
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get('/') #get is a route
def greet():
    return {"Hello, welcome to the ManSick prediction API!"}


#describing what we've sent to the server(response body)
class PredictionResponse(BaseModel):
    predicted_mental_health_score:float

top_countries = ['Other', 'India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France']



@app.post('/predict', response_model=PredictionResponse) #post is a route
def predict(data: StudentData): #student data is a class, data is an object
    country_group = data.country if data.country in top_countries else 'Other'
    input_row = pd.DataFrame([{
        'Age': data.age,
        'Gender': data.gender,
        'Country': data.country,
        'Academic_Level': data.academic_level,
        'Most_Used_Platform': data.most_used_platform,
        'Purpose_Of_Use': data.purpose_of_use,
        'Avg_Daily_Usage_Hours': data.avg_daily_usage_hours,
        'Daily_Unlocks': data.daily_unlocks,
        'Study_Hours': data.study_hours,
        'Physical_Activity_Hours': data.physical_activity_hours,
        'Sleep_Hours_Per_Night': data.sleep_hours_per_night,
        'Stress_Level': data.stress_level,
        'Grouped_country': country_group
    }])
    
    prediction = model.predict(input_row)[0]   #telling the model to predict the input row and get the first value of the prediction
    return PredictionResponse(predicted_mental_health_score= round(float(prediction), 2))


