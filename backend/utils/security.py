import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())
    
def verify_password(password_plain, password_hash):
    """Verifica si una contraseña coincide con su hash"""
    return bcrypt.checkpw(password_plain.encode('utf-8'), password_hash.encode('utf-8'))