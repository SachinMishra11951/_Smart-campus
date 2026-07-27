from fastapi import FastAPI , HTTPException
from pydantic import BaseModel, EmailStr, validator # Added validator here
from typing import Optional
import datetime
from schemas import *
import models
from models import User , Complaint , Resource , Booking 


def validate_roll_number(cls, v):
    if v is not None:
        v_upper = v.upper()

        valid_branches = ["IT", "CS", "EE", "ME", "CE"] 

        if not (5 <= len(v_upper) <= 7):
            raise ValueError("Roll number must be between 5 and 7 characters (e.g., EE2551)")
        
  
        branch = v_upper[:2]
        year = v_upper[2:4]
        roll_id = v_upper[4:]
        
    
        if branch not in valid_branches:
            raise ValueError(f"Branch must be one of {valid_branches}")
        if not year.isdigit() or len(year) != 2:
            raise ValueError("Year must be exactly 2 digits")
        if not roll_id.isdigit():
            raise ValueError("Roll ID must be numeric")
            
        return v_upper 
    return v



class UserCreate(BaseModel):
    name: str
    roll_number: str
    email: EmailStr
    password: str
    
    _val_roll = validator('roll_number', allow_reuse=True)(validate_roll_number)

class AdminUserUpdate(BaseModel):
    name : Optional[str] = None
    email : Optional[EmailStr] = None
    roll_number: Optional[str] = None
    password : Optional[str] = None
    role : Optional[UserRole] = None

    _val_roll = validator('roll_number', allow_reuse=True)(validate_roll_number)

class StudentUserUpdate(BaseModel):
    name: Optional[str] = None
    roll_number: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

    _val_roll = validator('roll_number', allow_reuse=True)(validate_roll_number)


class ComplaintCreate(BaseModel):
    title: str
    description: str
    suggested_solution: Optional[str] = None

class AdminAdminComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    suggested_solution: Optional[str] = None
    status: Optional[ComplaintStatus] = None
    category : Optional[ComplaintCategory] = None
    priority : Optional[ComplaintPriority] = None

class StudentComaplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    suggested_solution: Optional[str] = None  

class AdminTempPassUpdate(BaseModel):
    password : str

class ResourceCreate(BaseModel):
    name : str
    type : str
    available_quantity : int

class ResourceUpdate(BaseModel):
    name : Optional[str] = None
    type : Optional[str] = None
    available_quantity : Optional[int] = None

class BookingCreate(BaseModel):
    resource_id : int
    purpose : str
    remark : str
    booking_date : str
    time_slot : str

class AdminBookingUpdate(BaseModel):
    user_id : Optional[int] = None
    resource_id : Optional[int] = None
    status : Optional[ResourceStatus] = None

class StudentBookingUpdate(BaseModel):
    resource_id : Optional[int] = None
    purpose : Optional[str] = None
    remark : Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str