from app.services.parsing.pipeline import ParsingPipeline


def test_parse_and_chunk_python_function() -> None:
    pipeline = ParsingPipeline()
    files = {"main.py": "def hello():\n    return 'hi'\n"}
    chunks = pipeline.parse_and_chunk("p1", files)
    assert len(chunks) >= 1
    assert chunks[0]["file_path"] == "main.py"
