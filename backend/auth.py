from passlib.context import CryptContext
from enum import Enum
from jose import jwt
import datetime
from schemas import UserRole
from fastapi import Depends, HTTPException
from database import Sessionlocal
from models import User
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hashpassword(password : str):
    ha = pwd_context.hash(password)
    return ha

def verifypassword(password : str , ha :str):
    return pwd_context.verify(password , ha )

SECRET_KEY = "686c1219ccfcb5e7a299d899ca9bef569b483bb335d04980ca0ce8a5d0b2eb7e"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(user_id :int , role : UserRole ):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    tok = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return tok

def decode_access_token(jwttoken : str):
    try:
        return jwt.decode(jwttoken, SECRET_KEY, algorithms=[ALGORITHM])
    except:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"  
            )
    
def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)

    user_id = payload["user_id"]
    session = Sessionlocal()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return user
    finally:
        session.close()

def get_current_admin(user = Depends(get_current_user)):
    if user.role == "admin":
        return user 
    raise HTTPException(
        status_code = 403,
        detail = "Forbidden"
    )       