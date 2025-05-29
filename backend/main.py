from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union, Dict
from random import shuffle
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

games = {}
results = []
game_counter = 1

class GameInitRequest(BaseModel):
    count: int
    mode: str
    total_questions: int = 5  # 預設 5 題

class SubmitAnswerRequest(BaseModel):
    game_id: int
    answer: List[int]
    time_used: float

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

    questions = []
    for _ in range(data.total_questions):
        block_order = list(range(data.count))
        shuffle(block_order)
        correct_order = sorted(block_order)
        questions.append({
            "blocks": block_order,
            "answer": correct_order,
        })

    games[game_id] = {
        "id": game_id,
        "mode": data.mode,
        "current_question": 0,
        "total_questions": data.total_questions,
        "questions": questions,
        "score": 0,
        "history": []
    }

    return {
        "game_id": game_id,
        "message": "Game created. Please call /next_question to begin."
    }

@app.get("/next_question")
def get_next_question(game_id: int):
    game = games.get(game_id)
    if not game:
        return {"error": "Game not found"}

    cq = game["current_question"]
    if cq >= game["total_questions"]:
        return {"finished": True}

    question = game["questions"][cq]
    game["current_question"] += 1

    return {
        "game_id": game_id,
        "question_number": cq + 1,
        "total_questions": game["total_questions"],
        "blocks": question["blocks"],
        "mode": game["mode"]
    }

@app.post("/submit_answer")
def submit_answer(data: SubmitAnswerRequest):
    game = games.get(data.game_id)
    if not game:
        return {"error": "Game not found"}

    q_index = game["current_question"] - 1
    if q_index < 0 or q_index >= len(game["questions"]):
        return {"error": "Invalid question index"}

    correct = (data.answer == game["questions"][q_index]["answer"])
    score = 100 if correct else 0
    game["score"] += score

    record = {
        "question": q_index + 1,
        "answer": data.answer,
        "correct": correct,
        "score": score,
        "time_used": data.time_used
    }
    game["history"].append(record)

    return {
        "correct": correct,
        "score": score,
        "answer": game["questions"][q_index]["answer"]
    }

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
