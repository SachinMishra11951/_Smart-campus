from database import Base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship 
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)
    complaints = relationship("Complaint",back_populates="user")
    bookings = relationship("Booking" , back_populates = "user" )

class Complaint(Base):
    __tablename__="complaints"
    id=Column(Integer,primary_key=True,index=True)
    title=Column(String)
    description=Column(String)
    status=Column(String)
    category=Column(String)
    priority=Column(String)
    user_id=Column(Integer,ForeignKey("users.id"))
    created_at=Column(String)
    suggested_solution=Column(String , nullable=True)
    user = relationship("User",back_populates="complaints")

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer , primary_key = True)
    name = Column(String)
    type = Column(String)
    available_quantity = Column(Integer)
    bookings = relationship("Booking" , back_populates = "resource")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer , primary_key = True)
    user_id = Column(Integer,ForeignKey("users.id"))
    resource_id = Column(Integer,ForeignKey("resources.id"))
    status = Column(String)
    purpose = Column(String)
    remark = Column(String)
    booking_date = Column(String)
    time_slot = Column(String)
    resource = relationship("Resource" , back_populates="bookings")
    user = relationship("User",back_populates="bookings")