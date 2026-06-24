from enum import Enum 

class ComplaintStatus(str , Enum):
    PENDING      = "pending"
    OPEN         = "open"
    IN_PROGRESS  = "in_progress"
    RESOLVED     = "resolved"
    REOPENED     = "reopened"
    REJECTED     = "rejected"

class ComplaintCategory(str , Enum):
    IT_CSE = "IT/CSE"
    ELECTRICAL = "Electrical"
    MECHANICAL = "Mechanical"
    CIVIL = "Civil"
    HOSTEL = "Hostel"
    LIBRARY = "Library"
    ADMINISTRATION = "Administration"
    OTHER = "Other"

class ComplaintPriority(str , Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class UserRole(str , Enum):
    STUDENT = "student"
    ADMIN = "admin"

class ResourceStatus(str , Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RETURNED = "returned"