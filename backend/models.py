# Feature: Database Models Configuration
from database import Base
from sqlalchemy import *
from sqlalchemy.orm import relationship 

# Feature: User Data Entity
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    roll_number = Column(String, unique=True, nullable=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    reset_otp = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    complaints = relationship("Complaint", back_populates="user")
    bookings = relationship("Booking", back_populates="user")

# Feature: Complaint Data Entity
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

# Feature: Resource Data Entity
class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer , primary_key = True)
    name = Column(String)
    type = Column(String)
    available_quantity = Column(Integer)
    bookings = relationship("Booking" , back_populates = "resource")

# Feature: Booking Data Entity
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

# Feature: Notification Data Entity
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(String)
    user = relationship("User", backref="notifications")

# Feature: System Activity Log Entity
class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    description = Column(String, nullable=False)
    created_at = Column(String)