from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os, json

app = Flask(__name__)
app.secret_key = 'kyYeu2025@SecretKey'

UPLOAD_FOLDER = os.path.join('static', 'uploads')
DATA_DIR      = 'data'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_DIR,      exist_ok=True)

def _path(name):
    return os.path.join(DATA_DIR, name)

def load_json(name, default=None):
    if default is None: default = []
    try:
        p = _path(name)
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f'[load_json] {name}: {e}')
    return default

def save_json(name, data):
    try:
        with open(_path(name), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f'[save_json] {name}: {e}')
        return False

def next_id(lst):
    return max((x.get('id', 0) for x in lst), default=0) + 1

def ts():
    return datetime.now().isoformat()

# Init data files
_INIT = {
    'notes.json':    [],
    'comments.json': {},
    'reactions.json':{},
}
for fname, default in _INIT.items():
    if not os.path.exists(_path(fname)):
        save_json(fname, default)

@app.route('/')
def index():
    return render_template('index.html')

# ── LƯU BÚT ──────────────────────────────────────────
@app.route('/api/notes', methods=['GET', 'POST'])
def notes():
    if request.method == 'GET':
        return jsonify(load_json('notes.json', []))
    data = request.get_json(force=True) or {}
    name = data.get('name', '').strip()
    text = data.get('text', '').strip()
    if not name or not text:
        return jsonify({'ok': False, 'msg': 'Cần nhập tên và nội dung'}), 400
    lst  = load_json('notes.json', [])
    note = {'id': next_id(lst), 'name': name, 'text': text, 'ts': ts()}
    lst.insert(0, note)
    save_json('notes.json', lst)
    return jsonify({'ok': True, 'note': note}), 201

@app.route('/api/notes/<int:nid>', methods=['DELETE'])
def delete_note(nid):
    lst = load_json('notes.json', [])
    lst = [n for n in lst if n.get('id') != nid]
    save_json('notes.json', lst)
    return jsonify({'ok': True})

# ── BÌNH LUẬN ẢNH ────────────────────────────────────
@app.route('/api/comments/<int:photo_idx>', methods=['GET', 'POST'])
def comments(photo_idx):
    key = str(photo_idx)
    db  = load_json('comments.json', {})
    if request.method == 'GET':
        return jsonify(db.get(key, []))
    data = request.get_json(force=True) or {}
    name = data.get('name', '').strip()
    text = data.get('text', '').strip()
    if not name or not text:
        return jsonify({'ok': False, 'msg': 'Thiếu tên hoặc nội dung'}), 400
    if key not in db: db[key] = []
    cid = (max((c.get('id',0) for c in db[key]), default=0) + 1)
    cmt = {'id': cid, 'name': name, 'text': text, 'ts': ts()}
    db[key].append(cmt)
    save_json('comments.json', db)
    return jsonify({'ok': True, 'comment': cmt}), 201

@app.route('/api/comments/<int:photo_idx>/<int:cid>', methods=['DELETE'])
def delete_comment(photo_idx, cid):
    key = str(photo_idx)
    db  = load_json('comments.json', {})
    if key in db:
        db[key] = [c for c in db[key] if c.get('id') != cid]
        save_json('comments.json', db)
    return jsonify({'ok': True})

# ── REACT EMOJI ──────────────────────────────────────
@app.route('/api/reactions/<int:photo_idx>', methods=['GET', 'POST'])
def reactions(photo_idx):
    key = str(photo_idx)
    db  = load_json('reactions.json', {})
    if request.method == 'GET':
        return jsonify(db.get(key, {}))
    data  = request.get_json(force=True) or {}
    emoji = data.get('emoji', '')
    if not emoji:
        return jsonify({'ok': False, 'msg': 'Thiếu emoji'}), 400
    if key not in db: db[key] = {}
    db[key][emoji] = db[key].get(emoji, 0) + 1
    save_json('reactions.json', db)
    return jsonify({'ok': True, 'reactions': db[key]})

@app.errorhandler(404)
def e404(e): return jsonify({'ok': False, 'msg': 'Not found'}), 404

@app.errorhandler(500)
def e500(e): return jsonify({'ok': False, 'msg': 'Server error'}), 500

if __name__ == '__main__':
    print('=' * 50)
    print('Ky Yeu  ->  http://localhost:5000')
    print('=' * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)