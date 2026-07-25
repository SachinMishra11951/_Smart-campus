from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime
from database import engine, Base, Sessionlocal
import models
from enum import Enum 
from auth import *
from schemas import *
from pydant import *
from fastapi import Depends
from auth import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from email_utils import send_otp_email
import random
from fastapi.middleware.cors import CORSMiddleware
from models import User, Complaint, Resource, Booking, Notification, Activity

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://127.0.0.1:8000",
        "http://localhost:5500",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/me")
def get_me(current_user = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role
    }

@app.get("/")
def home():
    return {"message": "Welcome to the Smart Campuse Management System"}

@app.post("/login")
def login(form_data = Depends(OAuth2PasswordRequestForm)):
    session = Sessionlocal()
    if "@" in form_data.username:
        use = session.query(User).filter(User.email == form_data.username).first()
    else:
        use = session.query(User).filter(User.roll_number == form_data.username).first()
    
    if use is not None:
        if verifypassword(form_data.password, use.password):
            token = create_access_token(use.id, use.role)
            session.close()
            return {
                "access_token": token,
                "token_type": "bearer",
                "role": use.role,
                "user_id": use.id,
                "email": use.email,
                "name": use.name
            }
        else:
            session.close()
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"   
            )
    else:
        session.close()
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

@app.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    session = Sessionlocal()
    user = session.query(User).filter(User.email == data.email).first()
    if user is None:
        session.close()
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    otp = str(random.randint(100000, 999999))
    user.reset_otp = otp
    user.otp_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    session.commit()
    send_otp_email(user.email, otp)
    session.close()
    return {
        "message": "OTP sent successfully"
    }

@app.post("/verify-otp")
def verify_otp(data: VerifyOTPRequest):
    session = Sessionlocal()
    user = session.query(User).filter(User.email == data.email).first()
    if user is None:
        session.close()
        raise HTTPException(status_code=404, detail="User not found")
    if user.reset_otp != data.otp:
        session.close()
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if (
        user.otp_expiry is None
        or datetime.datetime.utcnow() > user.otp_expiry
    ):
        session.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    session.close()
    return {
        "message": "OTP verified successfully"
    }

@app.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    session = Sessionlocal()
    user = session.query(User).filter(User.email == data.email).first()
    if user is None:
        session.close()
        raise HTTPException(status_code=404, detail="User not found")
    if user.reset_otp != data.otp:
        session.close()
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if (
        user.otp_expiry is None
        or datetime.datetime.utcnow() > user.otp_expiry
    ):
        session.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    user.password = hashpassword(data.new_password)
    user.reset_otp = None
    user.otp_expiry = None
    session.commit()
    session.close()
    return {
        "message": "Password reset successfully"
    }

@app.get("/complaints")
def get_complaints(current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(Complaint)
    com = que.all()
    res = []
    for c in com:
        res.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "status": c.status,
            "category": c.category,
            "priority": c.priority,
            "user_id": c.user_id,
            "created_at": c.created_at,
            "suggested_solution": c.suggested_solution
        })
    session.close()
    return {"complaints": res}

@app.get("/complaints/{complaint_id}")
def get_complaint(complaint_id: int, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(Complaint)
    com = que.filter(Complaint.id == complaint_id).first()
    session.close()
    if com:
        return {
            "complaint": {
                "id": com.id,
                "title": com.title,
                "description": com.description,
                "status": com.status,
                "category": com.category,
                "priority": com.priority,
                "user_id": com.user_id,
                "created_at": com.created_at,
                "suggested_solution": com.suggested_solution
            }
        }
    raise HTTPException(
        status_code=404,
        detail="Complaint not found"
    )

@app.get("/users")
def admin_get_users(current_user = Depends(get_current_admin)):
    session = Sessionlocal()
    user = session.query(User)
    users = user.all()
    res = []
    for c in users:
        res.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "role": c.role,
        })
    session.close()
    return {"users": res}

@app.get("/users/{user_id}")
def admin_get_user(user_id: int, current_user = Depends(get_current_admin)):
    session = Sessionlocal()
    que = session.query(User)
    c = que.filter(User.id == user_id).first()
    session.close()
    if c:
        return {
            "user": {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "role": c.role,
            }
        }
    raise HTTPException(
        status_code=404,
        detail="User not found"
    )
  
@app.post("/complaints")
def student_create_complaint(complaint: ComplaintCreate, current_user = Depends(get_current_user)):
    if current_user.role == "admin":
        raise HTTPException(
            status_code=403,
            detail="Unauthorized"
        )
    session = Sessionlocal()
    que = session.query(User)
    use = que.filter(User.id == current_user.id).first()
    if use is None:
        session.close()
        raise HTTPException(
            status_code=404,
            detail="User not found"   
        )
    new_complaint = Complaint(
        title = complaint.title,
        description = complaint.description,
        user_id = current_user.id,
        status = "pending",
        category = None,
        priority = None,
        created_at = datetime.datetime.now().isoformat(),
        suggested_solution = complaint.suggested_solution
    )
    session.add(new_complaint)
    session.commit()
    id = new_complaint.id
    session.close()
    return {
        "message": "Complaint created successfully",
        "id": id
    }

@app.post("/users")
def create_user(user: UserCreate):
    session = Sessionlocal()
    que = session.query(User)
    use = que.filter(User.email == user.email).first()
    if use is not None:
        session.close()
        raise HTTPException(
            status_code=409,
            detail="User with this email already exist"
        )
    existing_roll = session.query(User).filter(User.roll_number == user.roll_number).first()
    if existing_roll:
        session.close()
        raise HTTPException(
            status_code=409,
            detail="Roll number already exists"
        )
    new_user = User(
        name=user.name,
        roll_number=user.roll_number,
        email=user.email,
        password=hashpassword(user.password),
        role="student"
    )
    session.add(new_user)
    session.commit()
    id = new_user.id
    session.close()
    return {
        "message": "User added successfully",
        "id": id
    }

@app.put("/complaints/{complaint_id}")
def admin_update_complaint(complaint_id: int, complaint: AdminAdminComplaintUpdate, current_user = Depends(get_current_admin)):
    session = Sessionlocal()
    que = session.query(Complaint)
    com = que.filter(Complaint.id == complaint_id).first()
    if com:
        if complaint.status is not None:
            com.status = complaint.status
        if complaint.category is not None:
            com.category = complaint.category
        if complaint.priority is not None:
            com.priority = complaint.priority
        session.commit()
        session.close()
        return {
            "message": "Complaint updated successfully",
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Complaint not found"
    )

@app.put("/users/{user_id}")
def admin_update_user(user_id: int, user: AdminUserUpdate, current_user = Depends(get_current_admin)):
    session = Sessionlocal()
    que = session.query(User)
    use = que.filter(User.id == user_id).first()
    if use:
        if user.name is not None:
            use.name = user.name
        existing = session.query(User).filter(User.roll_number == user.roll_number).first()
        if existing is not None and existing.id != use.id:
            session.close()
            raise HTTPException(
                status_code=409,
                detail="Roll number already exists"
            )
        use.roll_number = user.roll_number
        if user.email is not None:
            que = session.query(User)
            us = que.filter(User.email == user.email).first()
            if us is not None and us.id != use.id:
                session.close()
                raise HTTPException(
                    status_code=409,
                    detail="User with this email already exist"
                )
            use.email = user.email
        if user.password is not None:
            if use.id != current_user.id:
                session.close()
                raise HTTPException(
                    status_code=403,
                    detail="unauthorized"
                )
            use.password = hashpassword(user.password)
        if user.role is not None:
            use.role = user.role       
        session.commit()
        session.close()
        return {
            "message": "User updated successfully",
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="User not found"
    )

@app.delete("/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, current_user = Depends(get_current_admin)):
    session = Sessionlocal()
    que = session.query(Complaint)
    com = que.filter(Complaint.id == complaint_id).first()
    if com:
        session.delete(com)
        session.commit()
        session.close()
        return {
            "message": "Complaint deleted successfully"
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Complaint not found"
    )

@app.delete("/users/{user_id}")
def admin_delete_user(user_id: int, admin = Depends(get_current_admin)):
    session = Sessionlocal()
    que = session.query(User)
    use = que.filter(User.id == user_id).first()
    qu = session.query(Complaint)
    com = qu.filter(Complaint.user_id == user_id).first()
    if com is not None:
        session.close()
        raise HTTPException(
            status_code=409,
            detail="Conflict error"
        )
    q = session.query(Booking)
    boo = q.filter(Booking.user_id == user_id).first()
    if boo is not None:
        session.close()
        raise HTTPException(
            status_code=409,
            detail="Conflict error"
        )        
    if use:
        session.delete(use)
        session.commit()
        session.close()
        return {
            "message": "User deleted successfully"
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="User not found"
    )

@app.get("/resources")
def get_resources():
    session = Sessionlocal()
    que = session.query(Resource)
    res = que.all()
    ans = []
    for r in res:
        ans.append({
            "id": r.id,
            "name": r.name,
            "type": r.type,
            "available_quantity": r.available_quantity
        })
    session.close()
    return {"resources": ans}  # Returned lowercase 'resources' for JavaScript matching

@app.get("/resources/{resource_id}")
def get_resource(resource_id: int):
    session = Sessionlocal()
    que = session.query(Resource)
    res = que.filter(Resource.id == resource_id).first()
    session.close()
    if res:
        return {
            "resource": {
                "id": res.id,
                "name": res.name,
                "type": res.type,
                "available_quantity": res.available_quantity
            }
        }
    raise HTTPException(
        status_code=404,
        detail="Resource not found"
    )

@app.post("/resources")
def admin_create_resource(resource: ResourceCreate, admin = Depends(get_current_admin)):
    session = Sessionlocal()
    if resource.available_quantity < 0:
        session.close()
        raise HTTPException(
            status_code=422,
            detail="available_quantity<=0"
        )
    new_resource = Resource(
        name = resource.name,
        type = resource.type,
        available_quantity = resource.available_quantity
    )
    session.add(new_resource)
    session.commit()
    id = new_resource.id
    session.close()
    return {
        "message": "Resource added successfully",
        "id": id
    } 

@app.put("/resources/{resource_id}")
def admin_update_resources(resource_id: int, resource: ResourceUpdate, admin = Depends(get_current_admin)):
    session = Sessionlocal()
    que = session.query(Resource)
    res = que.filter(Resource.id == resource_id).first()
    if res:
        if resource.name is not None:
            res.name = resource.name
        if resource.type is not None:
            res.type = resource.type
        if resource.available_quantity is not None:
            if resource.available_quantity < 0:
                session.close()
                raise HTTPException(
                    status_code=422,
                    detail="available_quantity<=0"
                )
            res.available_quantity = resource.available_quantity
        session.commit()
        session.close()
        return {
            "message": "Resource updated successfully",
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Resource not found"
    )

@app.delete("/resources/{resource_id}")
def admin_delete_resource(resource_id: int, admin = Depends(get_current_admin)):
    session = Sessionlocal()
    que = session.query(Resource)
    res = que.filter(Resource.id == resource_id).first()
    qu = session.query(Booking)
    boo = qu.filter(Booking.resource_id == resource_id).all()
    for b in boo:
        if b.status == ResourceStatus.APPROVED or b.status == ResourceStatus.PENDING:
            session.close()
            raise HTTPException(
                status_code=409,
                detail="Resource has active bookings"
            )
    if res:
        session.delete(res)
        session.commit()
        session.close()
        return {
            "message": "Resource deleted succesfully"
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Resource not found"
    )   

@app.get("/bookings")
def get_bookings(current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(Booking)
    boo = que.all()
    res = []
    for b in boo:
        res.append({
            "id": b.id,
            "user_id": b.user_id,
            "resource_id": b.resource_id,
            "status": b.status, 
            "purpose": b.purpose,
            "remark": b.remark,
            "booking_date": b.booking_date,
            "time_slot": b.time_slot
        })
    session.close()
    return {"bookings": res}

@app.get("/bookings/{booking_id}")
def get_booking(booking_id: int, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(Booking)
    boo = que.filter(Booking.id == booking_id).first()
    session.close()
    if boo:
        return {
            "Booking": {
                "id": boo.id,
                "user_id": boo.user_id,
                "resource_id": boo.resource_id,
                "status": boo.status, 
                "purpose": boo.purpose,
                "remark": boo.remark,
                "booking_date": boo.booking_date,
                "time_slot": boo.time_slot               
            }
        }
    raise HTTPException(
        status_code=404,
        detail="Booking not found"
    )

@app.post("/bookings")
def create_booking(booking: BookingCreate, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(User)
    qu = session.query(Resource)
    use = que.filter(User.id == current_user.id).first()
    re = qu.filter(Resource.id == booking.resource_id).first()
    if use is None:
        session.close()
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    if re is None:
        session.close()
        raise HTTPException(
            status_code=404,
            detail="Resource not found"
        )
    if (re.available_quantity <= 0):
        session.close()
        raise HTTPException(
            status_code=400,
            detail="Resource unavailable"
        )
    new_booking = Booking(
        user_id = current_user.id,
        resource_id = booking.resource_id, 
        status = "pending",
        purpose = booking.purpose,
        remark = booking.remark,
        booking_date = booking.booking_date,
        time_slot = booking.time_slot
    )
    session.add(new_booking)
    session.commit()
    id = new_booking.id
    session.close()
    return {
        "message": "booking requested Succesfull",
        "booking request id": id
    }

@app.put("/bookings/{booking_id}")
def admin_update_booking(booking_id: int, booking: AdminBookingUpdate, current_user = Depends(get_current_admin)):
    session = Sessionlocal()
    que = session.query(Booking)
    boo = que.filter(Booking.id == booking_id).first()
    if boo:
        if booking.resource_id is not None:
            qu = session.query(Resource)
            re = qu.filter(Resource.id == booking.resource_id).first()
            if re is None:
                session.close()
                raise HTTPException(
                    status_code=404,
                    detail="Resource not found"
                )
            boo.resource_id = booking.resource_id 
        if booking.status is not None:
            old_status = boo.status
            if booking.status == old_status:
                session.close()
                raise HTTPException(
                    status_code=409,
                    detail="Booking already has this status"
                )
            qu = session.query(Resource)
            re = qu.filter(Resource.id == boo.resource_id).first()
            if booking.status == ResourceStatus.APPROVED:
                if old_status == ResourceStatus.APPROVED:
                    session.close()
                    raise HTTPException(
                        status_code=409,
                        detail="Booking already approved"
                    )
                if re.available_quantity <= 0:
                    session.close()
                    raise HTTPException(
                        status_code=400,
                        detail="Resource unavailable"
                    )
                re.available_quantity -= 1
            elif booking.status == ResourceStatus.RETURNED:
                if old_status != ResourceStatus.APPROVED:
                    session.close()
                    raise HTTPException(
                        status_code=400,
                        detail="Only approved bookings can be returned"
                    )
                re.available_quantity += 1
            elif booking.status == ResourceStatus.REJECTED:
                if old_status == ResourceStatus.RETURNED:
                    session.close()
                    raise HTTPException(
                        status_code=400,
                        detail="Returned booking cannot be rejected"
                    )
            boo.status = booking.status
        session.commit()
        session.close()
        return {
            "message": "Booking updated successfully",
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Booking not found"
    )        

@app.delete("/bookings/{booking_id}")
def admin_delete_booking(booking_id: int, current_user = Depends(get_current_admin)):
    session = Sessionlocal()
    que = session.query(Booking)
    boo = que.filter(Booking.id == booking_id).first()
    if boo:
        if boo.status == ResourceStatus.APPROVED:
            qu = session.query(Resource)
            re = qu.filter(Resource.id == boo.resource_id).first()
            re.available_quantity += 1
        session.delete(boo)
        session.commit()
        session.close()
        return {
            "message": "Booking deleted succesfully"
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Booking not found"
    )    

@app.get("/users/{user_id}/complaints")
def get_users_complaint(user_id: int, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(User)
    use = que.filter(User.id == user_id).first()
    if use is None:
        session.close()
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )   
    if use.id != current_user.id and current_user.role != "admin":
        session.close()
        raise HTTPException(
            status_code=403, 
            detail="Unauthorized"
        )
    res = []
    com = use.complaints
    for c in com:
        res.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "status": c.status,
            "category": c.category,
            "priority": c.priority,
            "user_id": c.user_id,
            "created_at": c.created_at,
            "suggested_solution": c.suggested_solution
        })  
    session.close()
    return {"complaints": res}
  
@app.get("/complaints/{complaint_id}/user")
def get_complaint_user(complaint_id: int, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(Complaint)
    com = que.filter(Complaint.id == complaint_id).first()
    if com is not None:
        use = com.user
        session.close()
        return {
            "user": {
                "id": use.id,
                "name": use.name,
                "email": use.email,
                "role": use.role
            }
        }   
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Complaint not found"
    )

@app.get("/resources/{resource_id}/bookings")
def get_resources_booking(resource_id: int, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(Resource)
    re = que.filter(Resource.id == resource_id).first()
    res = []
    if re is not None:
        books = re.bookings
        for b in books:
            res.append({
                "id": b.id,
                "user_id": b.user_id,
                "resource_id": b.resource_id,
                "status": b.status, 
                "purpose": b.purpose,
                "remark": b.remark,
                "booking_date": b.booking_date,
                "time_slot": b.time_slot
            })  
        session.close()
        return {"Bookings": res}
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Resource not found"
    )   

@app.get("/bookings/{booking_id}/resource")
def get_booking_resource(booking_id: int, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(Booking)
    boo = que.filter(Booking.id == booking_id).first()
    if boo is not None:
        r = boo.resource
        session.close()
        return {
            "resource": {
                "id": r.id,
                "name": r.name,
                "type": r.type,
                "available_quantity": r.available_quantity
            }
        }   
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Booking not found"
    )

@app.get("/users/{user_id}/bookings")
def get_users_booking(user_id: int, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(User)
    use = que.filter(User.id == user_id).first()
    if use is None:
        session.close()
        raise HTTPException(
            status_code=404,
            detail="User not found"
        ) 
    if use.id != current_user.id and current_user.role != "admin":
        session.close()
        raise HTTPException(
            status_code=403, 
            detail="Unauthorized"
        )
    res = []
    boo = use.bookings
    for b in boo:
        res.append({
            "id": b.id,
            "user_id": b.user_id,
            "resource_id": b.resource_id,
            "status": b.status, 
            "purpose": b.purpose,
            "remark": b.remark,
            "booking_date": b.booking_date,
            "time_slot": b.time_slot
        })  
    session.close()
    return {"bookings": res} 

@app.get("/bookings/{booking_id}/user")
def get_booking_user(booking_id: int, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(Booking)
    boo = que.filter(Booking.id == booking_id).first()
    if boo is not None:
        use = boo.user
        session.close()
        return {
            "user": {
                "id": use.id,
                "name": use.name,
                "email": use.email,
                "role": use.role
            }
        }   
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Booking not found"
    )

@app.get("/student/profile")
def get_student_profile(current_user = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="unauthorized"
        )
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "roll_number": current_user.roll_number,
            "email": current_user.email
        }
    } 

@app.get("/student/profile/{user_id}")
def get_own_profile(user_id: int, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(User)
    c = que.filter(User.id == user_id).first()
    if c is None or c.id != current_user.id:
        session.close()
        raise HTTPException(
            status_code=403,
            detail="unauthorized"
        )
    session.close()
    if c:
        return {
            "user": {
                "id": c.id,
                "name": c.name,
                "roll_number": c.roll_number,
                "email": c.email,
                "role": c.role,
            }
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="User not found"
    )

@app.put("/student/profile")
def update_student_profile(user: StudentUserUpdate, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(User)
    use = que.filter(User.id == current_user.id).first()
    if current_user.role != "student":
        session.close()
        raise HTTPException(
            status_code=403,
            detail="Unauthorized"
        )
    if use:
        if user.name is not None:
            use.name = user.name
        existing = session.query(User).filter(User.roll_number == user.roll_number).first()
        if existing is not None and existing.id != use.id:
            session.close()
            raise HTTPException(
                status_code=409,
                detail="Roll number already exists"
            )
        use.roll_number = user.roll_number
        if user.email is not None:
            que = session.query(User)
            us = que.filter(User.email == user.email).first()
            if us is not None and us.id != use.id:
                session.close()
                raise HTTPException(
                    status_code=409,
                    detail="User with this email already exist"
                )
            use.email = user.email
        if user.password is not None:
            use.password = hashpassword(user.password)     
        session.commit()
        session.close()
        return {
            "message": "User updated successfully",
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="User not found"
    )       

@app.put("/student/complaint/{complaint_id}")
def update_student_complaint(complaint_id: int, complaint: StudentComaplaintUpdate, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(Complaint)
    com = que.filter(Complaint.id == complaint_id).first()
    if com is None or com.user_id != current_user.id:
        session.close()
        raise HTTPException(
            status_code=403,
            detail="Unauthorized"
        )
    if com:
        if complaint.title is not None:
            com.title = complaint.title
        if complaint.description is not None:
            com.description = complaint.description
        if complaint.suggested_solution is not None:
            com.suggested_solution = complaint.suggested_solution
        session.commit()
        session.close()
        return {
            "message": "Complaint updated successfully",
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Complaint not found"
    )

@app.put("/student/booking/{booking_id}")
def update_student_booking(booking_id: int, booking: StudentBookingUpdate, current_user = Depends(get_current_user)):
    session = Sessionlocal()
    que = session.query(Booking)
    boo = que.filter(Booking.id == booking_id).first()
    if boo is None or boo.user_id != current_user.id:
        session.close()
        raise HTTPException(
            status_code=403,
            detail="Unauthorized"
        )
    if boo:
        if booking.purpose is not None:
            boo.purpose = booking.purpose         
        if booking.remark is not None:
            boo.remark = booking.remark
        session.commit()
        session.close()
        return {
            "message": "Booking updated successfully",
        }
    session.close()
    raise HTTPException(
        status_code=404,
        detail="Booking not found"
    )

@app.get("/notifications")
def get_notifications(current_user = Depends(get_current_user)):
    session = Sessionlocal()
    notifs = session.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.id.desc()).all()
    res = []
    for n in notifs:
        res.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at
        })
    session.close()
    return {"notifications": res}

@app.put("/notifications/read")
def mark_notifications_read(current_user = Depends(get_current_user)):
    session = Sessionlocal()
    notifs = session.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).all()
    for n in notifs:
        n.is_read = True
    session.commit()
    session.close()
    return {"message": "Notifications marked as read"}

@app.get("/activities")
def get_activities(current_user = Depends(get_current_user)):
    session = Sessionlocal()
    # Fetch the 20 most recent activities for the feed
    acts = session.query(Activity).order_by(Activity.id.desc()).limit(20).all()
    res = []
    for a in acts:
        res.append({
            "id": a.id,
            "type": a.type,
            "description": a.description,
            "created_at": a.created_at
        })
    session.close()
    return {"activities": res}