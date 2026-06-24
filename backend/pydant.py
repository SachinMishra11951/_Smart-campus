from fastapi import FastAPI , HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime
from schemas import *
import models
from models import User , Complaint , Resource , Booking 

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

class UserCreate(BaseModel):
    name : str
    email : EmailStr
    password : str   

class AdminUserUpdate(BaseModel):
    name : Optional[str] = None
    email : Optional[EmailStr] = None
    password : Optional[str] = None
    role : Optional[UserRole] = None

class AdminTempPassUpdate(BaseModel):
    password : str
    
class StudentUserUpdate(BaseModel):
    name : Optional[str] = None
    email : Optional[EmailStr] = None
    password : Optional[str] = None

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