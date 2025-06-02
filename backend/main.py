from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union, Dict
from random import shuffle
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 你的前端端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

games = {}
results = []
game_counter = 1

class GameInitRequest(BaseModel):
    difficulty: str  # 'easy', 'medium', 'hard'
    color_blind_type: str  # 'normal', 'protanopia', 'deuteranopia', 'tritanopia'
    game_mode: str  # 'color_sequence', 'memory_match'
    total_questions: int = 5  # 預設 5 題

class SubmitAnswerRequest(BaseModel):
    game_id: int
    answer: List[int]
    time_used: float
    errors_count: int # 新增錯誤次數

class LoginRequest(BaseModel):
    username: str
    password_hash: str

class LoginSuccessResponse(BaseModel):
    success: bool = True
    user_name: str

class LoginFailureResponse(BaseModel):
    success: bool = False
    message: str

class CreateAccountRequest(BaseModel):
    username: str
    password_hash: str # The password to save (should be hashed in a real scenario)

class CreateAccountSuccessResponse(BaseModel):
    success: bool = True
    message: str = "Account created successfully."
    user_name: str # Optionally return the username that was created

class CreateAccountFailureResponse(BaseModel):
    success: bool = False
    message: str

class SubmitScoreRequest(BaseModel):
    username: str
    score: int

# Model for a single player's score in the response list
class PlayerScore(BaseModel):
    rank: int
    username: str
    score: int

# Model for the API response containing the top scores list
class TopScoresResponse(BaseModel):
    top_scores: List[PlayerScore]

def load_users():
    try:
        with open("userinfo.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print("users.json not found. Please create it.")
        return []
    except json.JSONDecodeError:
        print("Error decoding users.json. Please check its format.")
        return []
    
def save_users(users: List[Dict]):
    """Saves user data to users.json."""
    with open("userinfo.json", "w") as f:
        json.dump(users, f, indent=4) # Use indent for pretty printing


def load_top_scores() -> List[Dict]:
    """Loads top scores data from top10scores.json."""
    try:
        with open('top10score.json', "r") as f:
            data = json.load(f)
            return [d for d in data if isinstance(d, dict) and 'username' in d and 'score' in d]
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        print(f"Warning: {'top10score.json'} is empty or malformed. Returning empty list.")
        return []

def save_top_scores(scores: List[Dict]):
    with open('top10score.json', "w") as f:
        json.dump(scores, f, indent=4) # Use indent for pretty printing

def update_and_sort_top_scores(current_scores: List[Dict], new_player_data: Dict) -> List[Dict]:
    """
    Adds new player data, sorts the list, and keeps only the top 10.
    """
    updated_scores = current_scores[:]

    if new_player_data != {}:
        updated_scores.append(new_player_data)
    
    updated_scores.sort(key=lambda x: x['score'], reverse=True)

    updated_scores = updated_scores[:10]

    ranked_scores = []
    for i, player in enumerate(updated_scores):
        ranked_scores.append({
            "rank": i + 1,
            "username": player['username'],
            "score": player['score']
        })
    return ranked_scores


@app.post("/start_game")
def start_game(data: GameInitRequest):
    global game_counter
    game_id = game_counter
    game_counter += 1

    # 根據難度設定色塊數量
    block_count = {
        'easy': 6,
        'medium': 9,
        'hard': 12
    }.get(data.difficulty, 9)  # 預設為中等難度

    questions = []
    if data.game_mode == 'color_sequence':
        # 顏色序列模式
        for _ in range(data.total_questions):
            block_order = list(range(block_count))
            shuffle(block_order)
            correct_order = sorted(block_order)
            questions.append({
                "blocks": block_order,
                "answer": correct_order,
            })
    else:
        # 記憶配對模式
        # 根據難度設定記憶配對的色塊數量 (必須是偶數)
        block_count = {
            'easy': 12,  # 6 對
            'medium': 16, # 8 對
            'hard': 20   # 10 對
        }.get(data.difficulty, 16) # 預設為中等難度 (16 個色塊)

        # 在記憶配對模式中，我們只需要一題
        # blocks 需要包含成對的顏色，所以我們需要 block_count / 2 種顏色，每種兩個
        colors = list(range(block_count // 2)) * 2
        shuffle(colors)

        questions.append({
            "blocks": colors,
            "answer": colors,  # 在記憶模式中，答案就是原始順序 (用於驗證，實際遊戲邏輯在前端)
        })

    games[game_id] = {
        "id": game_id,
        "mode": data.color_blind_type,
        "game_mode": data.game_mode,
        "count": block_count,
        "current_question": 0,
        "total_questions": len(questions),
        "questions": questions,
        "score": 0,
        "history": []
    }

    return {
        "game_id": game_id,
        "message": "Game created. Please call /next_question to begin."
    }

@app.get("/next_question")
async def next_question(game_id: int):
    try:
        game = games.get(game_id)
        if not game:
            return {"error": "Game not found", "finished": True}
        
        # 檢查是否超過題目總數
        if game["current_question"] >= len(game["questions"]):
            return {"finished": True}
        
        # 取得「當前」題目索引 (不要自動+1)
        current_index = game["current_question"]
        current_question = game["questions"][current_index]
        
        return {
            "blocks": current_question["blocks"],
            "question_number": current_index + 1,  # 顯示用題號
            "total_questions": game["total_questions"],  # 使用遊戲初始化時設定的總題數
            "finished": False
        }
    except Exception as e:
        return {"error": str(e), "finished": True}

@app.post("/submit_answer")
async def submit_answer(data: SubmitAnswerRequest):
    try:
        game = games.get(data.game_id)
        if not game:
            return {"error": "Game not found"}
            
        current_index = game["current_question"]
        current_question = game["questions"][current_index]
        correct_answer = current_question["answer"]

        # --- 新的計分邏輯 --- #
        block_count = game.get("count", 9) # 獲取難度/色塊數量，預設 9

        # 設定時間限制 (可根據 block_count 調整)
        # 這裡使用一個簡單的公式作為例子，可以根據需要調整
        time_limit = 5 + 1.2**(block_count - 6)
        if block_count < 6: # 確保小於6塊時也有個基礎時間
             time_limit = 10

        # 計算基礎分數 (基於錯誤次數)
        base_score = max(0, 100 - data.errors_count * 5)

        # 計算時間得分 (在時間限制內完成)
        time_score = max(0, (time_limit - data.time_used) * 2) # 每秒獎勵 2 分，可調整

        # 計算最終分數
        # 分數 = 基礎分數 + 時間得分，並確保不低於 0 且不超過某個上限 (例如 200)
        score = int(max(0, min(200, base_score + time_score)))

        # --- 計分邏輯結束 --- #
        
        game["score"] += score
        game["current_question"] += 1
        
        # 記錄詳細數據
        game["history"].append({
            "question": game["current_question"],
            "correct_answer": correct_answer,
            "user_answer": data.answer, 
            "time_used": data.time_used,
            "score_breakdown": {
                "accuracy": 1.0, 
                "time_bonus": max(0, (time_limit - data.time_used) / time_limit) if time_limit > 0 else 0 # 這裡的時間獎勵計算方式可以改變，或者記錄原始的 time_used
            },
            "errors_count": data.errors_count, 
            "score": score 
        })
        
        return {"correct": data.answer == correct_answer, "score": score}
    except Exception as e:
        return {"error": str(e)}


@app.get("/total_score")
def total_score(game_id: int):
    game = games.get(game_id)
    if not game:
        return {"error": "Game not found"}

    return {
        "game_id": game_id,
        "total_score": game["score"],
        "history": game["history"]
    }

@app.post("/log_in", response_model=Union[LoginSuccessResponse, LoginFailureResponse])
async def login(request: LoginRequest):
    """
    Handles user login requests.
    Checks username and password against users.json.
    """
    users = load_users()

    for user in users:
        if user["username"] == request.username and user["password"] == request.password_hash:
            print(f"User '{request.username}' logged in successfully.")
            return LoginSuccessResponse(user_name=request.username)

    # If no matching user is found
    print(f"Login attempt failed for username: '{request.username}'.")
    # Instead of raising HTTPException (which gives a 401 status),
    # we return a success: false response as the frontend expects
    return LoginFailureResponse(message="Invalid username or password.")

@app.post("/create_account", response_model=Union[CreateAccountSuccessResponse, CreateAccountFailureResponse])
async def create_account(request: CreateAccountRequest):
    """
    Handles new user account creation requests.
    Adds a new user to users.json if the username does not already exist.
    """
    users = load_users()

    # Check if username already exists
    for user in users:
        if user["username"] == request.username:
            print(f"Account creation failed: Username '{request.username}' already exists.")
            return CreateAccountFailureResponse(message="Username already exists. Please choose a different one.")

    # Add the new user to the list
    new_user = {
        "username": request.username,
        "password": request.password_hash # In a real app, hash this password before saving!
    }
    users.append(new_user)
    save_users(users) # Save the updated list back to the JSON file

    print(f"Account '{request.username}' created successfully.")
    return CreateAccountSuccessResponse(message="Account created successfully.", user_name=request.username)

@app.post("/submit_score", response_model=TopScoresResponse)
async def submit_score(request: SubmitScoreRequest):
    """
    Receives a new score and username, updates the top 10 list,
    and returns the current top 10 scores.
    """
    current_top_scores_raw = load_top_scores()

    new_player_data = {"username": request.username, "score": request.score}

    # Update, sort, and rank the scores
    updated_ranked_scores = update_and_sort_top_scores(current_top_scores_raw, new_player_data)
   
    scores_to_save = [{"username": p['username'], "score": p['score']} for p in updated_ranked_scores]
    save_top_scores(scores_to_save)

    print(f"Score submitted by {request.username}: {request.score}. Current Top 10:")
    for p in updated_ranked_scores:
        print(f"  Rank {p['rank']}: {p['username']} - {p['score']}")

    return TopScoresResponse(top_scores=updated_ranked_scores)

@app.get("/get_top_scores", response_model=TopScoresResponse)
async def get_top_scores():
    """
    Retrieves the current top 10 scores without submitting a new one.
    """
    current_top_scores_raw = load_top_scores()
    # Sort and rank them for display, even if no new score is submitted
    ranked_scores = update_and_sort_top_scores(current_top_scores_raw, {}) # Pass empty dict if no new score
    return TopScoresResponse(top_scores=ranked_scores)
