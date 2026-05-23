from passlib.context import CryptContext

from jose import jwt

from datetime import datetime, timedelta

from fastapi.security import OAuth2PasswordBearer

from fastapi import Depends, HTTPException

# =================================================
# SECRET CONFIG
# =================================================

SECRET_KEY = "inventorysecretkey"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_HOURS = 2

# =================================================
# PASSWORD HASHING
# =================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# =================================================
# OAUTH2 SCHEME
# =================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)

# =================================================
# HASH PASSWORD
# =================================================

def hash_password(password):

    return pwd_context.hash(password)

# =================================================
# VERIFY PASSWORD
# =================================================

def verify_password(
    plain_password,
    hashed_password
):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )

# =================================================
# CREATE JWT TOKEN
# =================================================

def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        hours=ACCESS_TOKEN_EXPIRE_HOURS
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt

# =================================================
# VERIFY CURRENT USER
# =================================================

def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except:

        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

# =================================================
# ADMIN ACCESS ONLY
# =================================================

def admin_only(
    current_user: dict = Depends(get_current_user)
):

    if current_user.get("role") != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin Access Required"
        )

    return current_user