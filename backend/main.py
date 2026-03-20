from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import os

app = FastAPI(title="汤原农文旅云认养平台API", version="2.0.0")

# CORS配置 - 生产环境应指定具体域名
allowed_origins = os.getenv("ALLOWED_ORIGIN", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 数据模型 ====================

class LoginRequest(BaseModel):
    phone: str
    code: str
    nickname: Optional[str] = None

class OrderVerifyRequest(BaseModel):
    order_no: str

class SendCodeRequest(BaseModel):
    phone: str

class User(BaseModel):
    id: str
    phone: str
    nickname: str
    created_at: datetime

class FarmLand(BaseModel):
    id: str
    user_id: str
    land_no: str
    area: float
    address: str
    year: int
    ddc_id: Optional[str] = None
    created_at: datetime

class Right(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    supplier: str

# ==================== 模拟数据库 ====================

users_db: dict = {}
farms_db: dict = {}
sms_codes: dict = {}  # {phone: {"code": xxx, "expires_at": datetime}}

rights_db: List[dict] = [
    {"id": "1", "title": "优质大米", "description": "每年可获得认养面积对应的新鲜大米", "icon": "🌾", "supplier": "本来生活"},
    {"id": "2", "title": "实时监控", "description": "通过物联网设备实时查看田地生长情况", "icon": "📷", "supplier": "汤原县政府"},
    {"id": "3", "title": "溯源查询", "description": "全程追溯农产品生长、加工、运输过程", "icon": "🔍", "supplier": "区块链溯源平台"},
    {"id": "4", "title": "线下活动", "description": "优先参与汤原县线下农旅活动", "icon": "🎁", "supplier": "文旅创新中心"},
    {"id": "5", "title": "民宿优惠", "description": "合作民宿享受专属折扣", "icon": "🏨", "supplier": "本来生活"},
    {"id": "6", "title": "景区门票", "description": "汤原县景区免费或优惠门票", "icon": "🎫", "supplier": "文旅创新中心"},
]

# ==================== 工具函数 ====================

def generate_code():
    """生成6位验证码"""
    return str(uuid.uuid4().int)[:6]

def send_sms(phone: str, code: str):
    """
    发送短信 - 实际项目中对接阿里云/腾讯云短信API
    短信配置从环境变量获取:
    - SMS_PROVIDER: aliyun | tencent
    - ALIYUN_ACCESS_KEY_ID, ALIYUN_ACCESS_KEY_SECRET
    - ALIYUN_SMS_SIGN_NAME, ALIYUN_SMS_TEMPLATE_CODE
    """
    provider = os.getenv("SMS_PROVIDER", "aliyun")

    if provider == "aliyun":
        # 阿里云短信API调用
        pass

    # 开发环境打印验证码
    print(f"[SMS] 发送短信: phone={phone}, code={code}")

def verify_sms_code(phone: str, code: str) -> bool:
    """验证短信验证码"""
    if phone not in sms_codes:
        return False

    record = sms_codes[phone]
    if record["expires_at"] < datetime.now():
        del sms_codes[phone]
        return False

    if record["code"] != code:
        return False

    del sms_codes[phone]  # 验证成功后删除
    return True

# ==================== API接口 ====================

@app.get("/")
def root():
    return {"message": "汤原农文旅云认养平台API", "version": "2.0.0"}

# 登录相关

@app.post("/api/send-code")
def send_code(req: SendCodeRequest):
    """发送验证码"""
    if not req.phone or not req.phone.startswith("1") or len(req.phone) != 11:
        raise HTTPException(status_code=400, detail="手机号格式不正确")

    code = generate_code()
    sms_codes[req.phone] = {
        "code": code,
        "expires_at": datetime.now() + timedelta(minutes=5)
    }

    send_sms(req.phone, code)
    return {"message": "验证码已发送"}

@app.post("/api/login")
def login(req: LoginRequest):
    """手机号验证码登录"""
    if not verify_sms_code(req.phone, req.code):
        raise HTTPException(status_code=401, detail="验证码错误或已过期")

    # 查找或创建用户
    user_id = None
    for uid, user in users_db.items():
        if user["phone"] == req.phone:
            user_id = uid
            break

    if not user_id:
        user_id = str(uuid.uuid4())
        users_db[user_id] = {
            "id": user_id,
            "phone": req.phone,
            "nickname": req.nickname or "用户",
            "created_at": datetime.now().isoformat()
        }

    return {
        "token": user_id,
        "user": users_db[user_id]
    }

# 云认养流程

@app.post("/api/verify-order")
def verify_order(req: OrderVerifyRequest):
    """验证订单编号"""
    # 模拟验证 - 实际需要对接订单系统
    if len(req.order_no) == 6:
        return {
            "valid": True,
            "order": {
                "order_no": req.order_no,
                "phone": "138****8888",
                "rice_qty": 100,
                "area": 10,
                "address": "黑龙江省汤原县胜利乡",
                "year": datetime.now().year
            }
        }
    return {"valid": False, "message": "订单编号无效"}

@app.post("/api/allocate-land")
def allocate_land(user_id: str, order_no: str):
    """分配数字田地"""
    if user_id not in users_db:
        raise HTTPException(status_code=401, detail="用户不存在")

    farm_id = str(uuid.uuid4())
    year = datetime.now().year
    farm = {
        "id": farm_id,
        "user_id": user_id,
        "land_no": f"TY-{year}-{uuid.uuid4().hex[:6].upper()}",
        "area": 10,
        "address": "黑龙江省汤原县胜利乡",
        "year": year,
        "ddc_id": f"0x{uuid.uuid4().hex[:12]}",
        "created_at": datetime.now().isoformat()
    }
    farms_db[farm_id] = farm
    return {"farm": farm}

# 用户相关

@app.get("/api/user/{user_id}")
def get_user(user_id: str):
    """获取用户信息"""
    if user_id in users_db:
        return users_db[user_id]
    return {"error": "用户不存在"}

# 田地相关

@app.get("/api/farms/{user_id}")
def get_user_farms(user_id: str):
    """获取用户的所有田地"""
    farms = [f for f in farms_db.values() if f["user_id"] == user_id]
    return {"farms": farms}

# 权益相关

@app.get("/api/rights")
def get_rights():
    """获取权益列表"""
    return {"rights": rights_db}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)