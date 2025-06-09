import subprocess

MODEL = "llama3.2:latest"

def llama_chat(user_message: str) -> str:
    prompt = (
        "<<SYS>>\n"
        "You are a helpful shopping assistant.\n"
        "<</SYS>>\n\n"
        f"[INST] {user_message} [/INST]\n"
    )

    result = subprocess.run(
        ["ollama", "run", MODEL, prompt],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        raise RuntimeError(f"Ollama CLI error:\n{result.stderr}")

    return result.stdout.strip()
