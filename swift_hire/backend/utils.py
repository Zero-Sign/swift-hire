from pathlib import Path

from fastapi import HTTPException, UploadFile


async def save_upload_file(upload_file: UploadFile, destination: str) -> str:
    """
    Save an uploaded file to the specified destination
    Returns the file path where the file was saved
    """
    try:
        # Create directory if it doesn't exist
        directory = Path(destination).parent
        directory.mkdir(parents=True, exist_ok=True)

        # Save the file
        with open(destination, "wb") as buffer:
            buffer.write(await upload_file.read())

        return destination
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")


def generate_unique_filename(email: str, file_type: str, original_filename: str) -> str:
    """
    Generate a unique filename for uploaded files
    """
    safe_filename = f"{email}_{file_type}_{original_filename}".replace(" ", "_")
    return f"uploads/{safe_filename}"
