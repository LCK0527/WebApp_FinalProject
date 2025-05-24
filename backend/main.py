from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from random import shuffle

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