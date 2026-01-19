import io
import tokenize
import json
import os

def remove_comments_and_docstrings(source):
    io_obj = io.StringIO(source)
    out = ""
    prev_toktype = tokenize.INDENT
    last_lineno = -1
    last_col = 0
    
    try:
        tokgen = tokenize.generate_tokens(io_obj.readline)
        for toktype, ttext, (slineno, scol), (elineno, ecol), ltext in tokgen:
            if slineno > last_lineno:
                last_col = 0
            if scol > last_col:
                out += " " * (scol - last_col)
            
            if toktype == tokenize.COMMENT:
                pass
            elif toktype == tokenize.STRING:
                if prev_toktype in (tokenize.INDENT, tokenize.NEWLINE, tokenize.NL):
                    pass
                else:
                    out += ttext
            else:
                out += ttext
            
            prev_toktype = toktype
            last_col = ecol
            last_lineno = elineno
        return out
    except Exception as e:
        return source

files_to_process = [
    "app.py",
    "baseline_model.py",
    "column_identification.py",
    "data_analysis.py",
    "models.py",
    "utils.py"
]

results = {}

for filename in files_to_process:
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            cleaned = remove_comments_and_docstrings(content)
            results[filename] = cleaned

output_json = json.dumps(results, indent=2)

with open("cleaned_code.json", "w", encoding='utf-8') as f:
    f.write(output_json)

print("JSON file created successfully: cleaned_code.json")
print(f"Processed {len(results)} files")
