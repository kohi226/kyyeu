from flask import Flask, render_template, request, jsonify, session
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'kyYeuSecretKey2024@#$'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp3', 'wav', 'webm', 'ogg'}

# Tạo thư mục nếu chưa có
os.makedirs('static/uploads', exist_ok=True)
os.makedirs('data', exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_json(filename, default=None):
    if default is None:
        default = []
    filepath = os.path.join('data', filename)
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
    except:
        pass
    return default

def save_json(filename, data):
    filepath = os.path.join('data', filename)
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving {filename}: {e}")
        return False

@app.route('/')
def index():
    return render_template('index.html', is_admin=session.get('admin', False))

@app.route('/api/save-name', methods=['POST'])
def save_name():
    try:
        data = request.get_json()
        session['user_name'] = data.get('name', '')
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== MESSAGES ==========
@app.route('/api/messages', methods=['GET', 'POST'])
def handle_messages():
    try:
        if request.method == 'GET':
            messages = load_json('data.json', [])
            return jsonify(messages)
        
        if request.method == 'POST':
            messages = load_json('data.json', [])
            name = request.form.get('name', 'Ẩn danh')
            content = request.form.get('content', '')
            
            if not content:
                return jsonify({'success': False, 'message': 'Vui lòng nhập nội dung'}), 400
            
            image_url = None
            if 'image' in request.files:
                file = request.files['image']
                if file and file.filename and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    filename = f"{timestamp}_{filename}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    image_url = f"/static/uploads/{filename}"
            
            new_message = {
                'id': max([m.get('id', 0) for m in messages], default=0) + 1,
                'name': name,
                'content': content,
                'image': image_url,
                'timestamp': datetime.now().isoformat(),
                'reactions': {}
            }
            
            messages.append(new_message)
            save_json('data.json', messages)
            
            return jsonify({'success': True, 'message': new_message})
    except Exception as e:
        print(f"Error in handle_messages: {e}")
        return jsonify({'success': False, 'message': 'Lỗi server: ' + str(e)}), 500

@app.route('/api/messages/<int:message_id>', methods=['DELETE'])
def delete_message(message_id):
    try:
        if not session.get('admin'):
            return jsonify({'success': False, 'message': 'Không có quyền'}), 403
        
        messages = load_json('data.json', [])
        messages = [m for m in messages if m.get('id') != message_id]
        save_json('data.json', messages)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== REACTIONS ==========
@app.route('/api/messages/<int:message_id>/react', methods=['POST'])
def react_message(message_id):
    try:
        data = request.get_json()
        emoji = data.get('emoji', '❤️')
        user = data.get('user', 'Ẩn danh')
        
        messages = load_json('data.json', [])
        for msg in messages:
            if msg.get('id') == message_id:
                if 'reactions' not in msg:
                    msg['reactions'] = {}
                if emoji not in msg['reactions']:
                    msg['reactions'][emoji] = []
                if user not in msg['reactions'][emoji]:
                    msg['reactions'][emoji].append(user)
                else:
                    msg['reactions'][emoji].remove(user)
                    if not msg['reactions'][emoji]:
                        del msg['reactions'][emoji]
                save_json('data.json', messages)
                return jsonify({'success': True, 'reactions': msg['reactions']})
        
        return jsonify({'success': False, 'message': 'Không tìm thấy'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== FAVORITES ==========
@app.route('/api/favorites', methods=['GET', 'POST'])
def handle_favorites():
    try:
        user = session.get('user_name', 'guest')
        favorites = load_json('favorites.json', {})
        
        if request.method == 'GET':
            return jsonify(favorites.get(user, []))
        
        if request.method == 'POST':
            data = request.get_json()
            item_type = data.get('type')
            item_id = data.get('id')
            
            if user not in favorites:
                favorites[user] = []
            
            item = {'type': item_type, 'id': item_id}
            if item in favorites[user]:
                favorites[user].remove(item)
            else:
                favorites[user].append(item)
            
            save_json('favorites.json', favorites)
            return jsonify({'success': True, 'favorites': favorites[user]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== NOTIFICATIONS ==========
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    try:
        user = session.get('user_name', 'guest')
        notifications = load_json('notifications.json', {})
        user_notifs = notifications.get(user, [])
        return jsonify(user_notifs)
    except Exception as e:
        return jsonify([]), 500

@app.route('/api/notifications/read', methods=['POST'])
def mark_notifications_read():
    try:
        user = session.get('user_name', 'guest')
        notifications = load_json('notifications.json', {})
        if user in notifications:
            for notif in notifications[user]:
                notif['read'] = True
            save_json('notifications.json', notifications)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False}), 500

# ========== FUTURE WISHES ==========
@app.route('/api/future-wishes', methods=['GET', 'POST'])
def handle_future_wishes():
    try:
        if request.method == 'GET':
            wishes = load_json('future.json', [])
            return jsonify(wishes)
        
        if request.method == 'POST':
            wishes = load_json('future.json', [])
            data = request.get_json()
            name = data.get('name', 'Ẩn danh')
            wish = data.get('wish', '')
            
            if not wish:
                return jsonify({'success': False, 'message': 'Vui lòng nhập điều ước'}), 400
            
            new_wish = {
                'id': max([w.get('id', 0) for w in wishes], default=0) + 1,
                'name': name,
                'wish': wish,
                'timestamp': datetime.now().isoformat()
            }
            
            wishes.append(new_wish)
            save_json('future.json', wishes)
            
            return jsonify({'success': True, 'wish': new_wish})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/future-wishes/<int:wish_id>', methods=['DELETE'])
def delete_wish(wish_id):
    try:
        if not session.get('admin'):
            return jsonify({'success': False, 'message': 'Không có quyền'}), 403
        
        wishes = load_json('future.json', [])
        wishes = [w for w in wishes if w.get('id') != wish_id]
        save_json('future.json', wishes)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== TEACHER MESSAGES ==========
@app.route('/api/teacher-messages', methods=['GET', 'POST'])
def handle_teacher_messages():
    try:
        if request.method == 'GET':
            messages = load_json('teacher_messages.json', [])
            return jsonify(messages)
        
        if request.method == 'POST':
            if not session.get('admin'):
                return jsonify({'success': False, 'message': 'Không có quyền'}), 403
            
            messages = load_json('teacher_messages.json', [])
            data = request.get_json()
            name = data.get('name', '')
            content = data.get('content', '')
            
            if not name or not content:
                return jsonify({'success': False, 'message': 'Vui lòng nhập đầy đủ thông tin'}), 400
            
            new_message = {
                'id': max([m.get('id', 0) for m in messages], default=0) + 1,
                'name': name,
                'content': content,
                'timestamp': datetime.now().isoformat()
            }
            
            messages.append(new_message)
            save_json('teacher_messages.json', messages)
            
            return jsonify({'success': True, 'message': new_message})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== PRELOADED IMAGES ==========
@app.route('/api/preloaded-images', methods=['GET'])
def get_preloaded_images():
    try:
        images = load_json('preloaded_images.json', [])
        return jsonify(images)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/preloaded-images/<int:image_id>', methods=['PUT'])
def update_image_description(image_id):
    try:
        if not session.get('admin'):
            return jsonify({'success': False, 'message': 'Không có quyền'}), 403
        
        images = load_json('preloaded_images.json', [])
        data = request.get_json()
        new_desc = data.get('description', '')
        
        for img in images:
            if img.get('id') == image_id:
                img['description'] = new_desc
                save_json('preloaded_images.json', images)
                return jsonify({'success': True, 'image': img})
        
        return jsonify({'success': False, 'message': 'Không tìm thấy ảnh'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== COMMENTS ==========
@app.route('/api/comments', methods=['GET', 'POST'])
def handle_comments():
    try:
        if request.method == 'GET':
            comments = load_json('comments.json', {})
            return jsonify(comments)
        
        if request.method == 'POST':
            data = request.get_json()
            image_id = str(data.get('image_id', ''))
            name = data.get('name', 'Ẩn danh')
            comment = data.get('comment', '')
            
            if not comment:
                return jsonify({'success': False, 'message': 'Vui lòng nhập bình luận'}), 400
            
            comments = load_json('comments.json', {})
            
            if image_id not in comments:
                comments[image_id] = []
            
            new_comment = {
                'id': len(comments[image_id]) + 1,
                'name': name,
                'comment': comment,
                'timestamp': datetime.now().isoformat()
            }
            
            comments[image_id].append(new_comment)
            save_json('comments.json', comments)
            
            return jsonify({'success': True, 'comment': new_comment})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/comments/<int:image_id>/<int:comment_id>', methods=['DELETE'])
def delete_comment(image_id, comment_id):
    try:
        if not session.get('admin'):
            return jsonify({'success': False, 'message': 'Không có quyền'}), 403
        
        comments = load_json('comments.json', {})
        image_id_str = str(image_id)
        
        if image_id_str in comments:
            comments[image_id_str] = [c for c in comments[image_id_str] if c.get('id') != comment_id]
            save_json('comments.json', comments)
            return jsonify({'success': True})
        
        return jsonify({'success': False, 'message': 'Không tìm thấy bình luận'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== STORY TIMELINE ==========
@app.route('/api/timeline', methods=['GET', 'POST'])
def handle_timeline():
    try:
        if request.method == 'GET':
            timeline = load_json('timeline.json', [])
            return jsonify(timeline)
        
        if request.method == 'POST':
            if not session.get('admin'):
                return jsonify({'success': False, 'message': 'Chỉ admin mới có thể thêm'}), 403
            
            timeline = load_json('timeline.json', [])
            
            title = request.form.get('title', '')
            description = request.form.get('description', '')
            date = request.form.get('date', '')
            
            if not title or not date:
                return jsonify({'success': False, 'message': 'Vui lòng nhập đầy đủ'}), 400
            
            images = []
            if 'images' in request.files:
                files = request.files.getlist('images')
                for file in files:
                    if file and allowed_file(file.filename):
                        filename = secure_filename(file.filename)
                        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                        filename = f"{timestamp}_{filename}"
                        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                        file.save(filepath)
                        images.append(f"/static/uploads/{filename}")
            
            new_event = {
                'id': max([t.get('id', 0) for t in timeline], default=0) + 1,
                'title': title,
                'description': description,
                'date': date,
                'images': images,
                'timestamp': datetime.now().isoformat()
            }
            
            timeline.append(new_event)
            timeline.sort(key=lambda x: x['date'])
            save_json('timeline.json', timeline)
            
            return jsonify({'success': True, 'event': new_event})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/timeline/<int:event_id>', methods=['DELETE'])
def delete_timeline_event(event_id):
    try:
        if not session.get('admin'):
            return jsonify({'success': False, 'message': 'Không có quyền'}), 403
        
        timeline = load_json('timeline.json', [])
        timeline = [t for t in timeline if t.get('id') != event_id]
        save_json('timeline.json', timeline)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== TIMELINE COMMENTS ==========
@app.route('/api/timeline/<int:event_id>/comments', methods=['GET', 'POST'])
def handle_timeline_comments(event_id):
    try:
        comments = load_json('timeline_comments.json', {})
        event_key = str(event_id)
        
        if request.method == 'GET':
            return jsonify(comments.get(event_key, []))
        
        if request.method == 'POST':
            data = request.get_json()
            name = data.get('name', 'Ẩn danh')
            comment = data.get('comment', '')
            
            if not comment:
                return jsonify({'success': False, 'message': 'Vui lòng nhập bình luận'}), 400
            
            if event_key not in comments:
                comments[event_key] = []
            
            new_comment = {
                'id': len(comments[event_key]) + 1,
                'name': name,
                'comment': comment,
                'timestamp': datetime.now().isoformat()
            }
            
            comments[event_key].append(new_comment)
            save_json('timeline_comments.json', comments)
            
            return jsonify({'success': True, 'comment': new_comment})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== POLLS/VOTING ==========
@app.route('/api/polls', methods=['GET', 'POST'])
def handle_polls():
    try:
        if request.method == 'GET':
            polls = load_json('polls.json', [])
            return jsonify(polls)
        
        if request.method == 'POST':
            if not session.get('admin'):
                return jsonify({'success': False, 'message': 'Chỉ admin mới có thể tạo poll'}), 403
            
            polls = load_json('polls.json', [])
            data = request.get_json()
            
            question = data.get('question', '')
            options = data.get('options', [])
            
            if not question or len(options) < 2:
                return jsonify({'success': False, 'message': 'Cần câu hỏi và ít nhất 2 lựa chọn'}), 400
            
            new_poll = {
                'id': max([p.get('id', 0) for p in polls], default=0) + 1,
                'question': question,
                'options': options,
                'votes': {opt: [] for opt in options},
                'timestamp': datetime.now().isoformat()
            }
            
            polls.append(new_poll)
            save_json('polls.json', polls)
            
            return jsonify({'success': True, 'poll': new_poll})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/polls/<int:poll_id>/vote', methods=['POST'])
def vote_poll(poll_id):
    try:
        data = request.get_json()
        option = data.get('option', '')
        user = data.get('user', 'Ẩn danh')
        
        polls = load_json('polls.json', [])
        for poll in polls:
            if poll.get('id') == poll_id:
                # Remove old vote
                for opt in poll['votes']:
                    if user in poll['votes'][opt]:
                        poll['votes'][opt].remove(user)
                
                # Add new vote
                if option in poll['votes']:
                    poll['votes'][option].append(user)
                
                save_json('polls.json', polls)
                return jsonify({'success': True, 'votes': poll['votes']})
        
        return jsonify({'success': False, 'message': 'Không tìm thấy poll'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/polls/<int:poll_id>', methods=['DELETE'])
def delete_poll(poll_id):
    try:
        if not session.get('admin'):
            return jsonify({'success': False, 'message': 'Không có quyền'}), 403
        
        polls = load_json('polls.json', [])
        polls = [p for p in polls if p.get('id') != poll_id]
        save_json('polls.json', polls)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== ACHIEVEMENTS ==========
@app.route('/api/achievements', methods=['GET', 'POST'])
def handle_achievements():
    try:
        if request.method == 'GET':
            achievements = load_json('achievements.json', [])
            return jsonify(achievements)
        
        if request.method == 'POST':
            if not session.get('admin'):
                return jsonify({'success': False, 'message': 'Chỉ admin có thể thêm'}), 403
            
            achievements = load_json('achievements.json', [])
            data = request.get_json()
            
            title = data.get('title', '')
            description = data.get('description', '')
            icon = data.get('icon', '🏆')
            
            if not title:
                return jsonify({'success': False, 'message': 'Cần tiêu đề'}), 400
            
            new_achievement = {
                'id': max([a.get('id', 0) for a in achievements], default=0) + 1,
                'title': title,
                'description': description,
                'icon': icon,
                'timestamp': datetime.now().isoformat()
            }
            
            achievements.append(new_achievement)
            save_json('achievements.json', achievements)
            
            return jsonify({'success': True, 'achievement': new_achievement})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/achievements/<int:achievement_id>', methods=['DELETE'])
def delete_achievement(achievement_id):
    try:
        if not session.get('admin'):
            return jsonify({'success': False, 'message': 'Không có quyền'}), 403
        
        achievements = load_json('achievements.json', [])
        achievements = [a for a in achievements if a.get('id') != achievement_id]
        save_json('achievements.json', achievements)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== BIRTHDAYS ==========
@app.route('/api/birthdays', methods=['GET', 'POST'])
def handle_birthdays():
    try:
        if request.method == 'GET':
            birthdays = load_json('birthdays.json', [])
            return jsonify(birthdays)
        
        if request.method == 'POST':
            if not session.get('admin'):
                return jsonify({'success': False, 'message': 'Chỉ admin có thể thêm'}), 403
            
            birthdays = load_json('birthdays.json', [])
            data = request.get_json()
            
            name = data.get('name', '')
            date = data.get('date', '')  # Format: MM-DD
            
            if not name or not date:
                return jsonify({'success': False, 'message': 'Cần đầy đủ thông tin'}), 400
            
            new_birthday = {
                'id': max([b.get('id', 0) for b in birthdays], default=0) + 1,
                'name': name,
                'date': date
            }
            
            birthdays.append(new_birthday)
            save_json('birthdays.json', birthdays)
            
            return jsonify({'success': True, 'birthday': new_birthday})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/check-birthday', methods=['GET'])
def check_birthday():
    try:
        today = datetime.now().strftime('%m-%d')
        birthdays = load_json('birthdays.json', [])
        
        birthday_people = [b for b in birthdays if b.get('date') == today]
        
        return jsonify({'birthday_people': birthday_people})
    except Exception as e:
        return jsonify({'birthday_people': []}), 500

# ========== USER STATS & BADGES ==========
@app.route('/api/user-stats/<username>', methods=['GET'])
def get_user_stats(username):
    try:
        messages = load_json('data.json', [])
        comments = load_json('comments.json', {})
        timeline_comments = load_json('timeline_comments.json', {})
        wishes = load_json('future.json', [])
        
        # Count user activities
        user_messages = len([m for m in messages if m.get('name') == username])
        
        user_comments = 0
        for img_comments in comments.values():
            user_comments += len([c for c in img_comments if c.get('name') == username])
        
        for event_comments in timeline_comments.values():
            user_comments += len([c for c in event_comments if c.get('name') == username])
        
        user_wishes = len([w for w in wishes if w.get('name') == username])
        
        # Count reactions received
        reactions_received = 0
        for msg in messages:
            if msg.get('name') == username and 'reactions' in msg:
                for users in msg['reactions'].values():
                    reactions_received += len(users)
        
        # Calculate badges
        badges = []
        if user_messages >= 5:
            badges.append({'name': 'Người Viết Nhiều', 'icon': '✍️', 'desc': 'Đã gửi 5+ lời chúc'})
        if user_comments >= 10:
            badges.append({'name': 'Người Bình Luận Tích Cực', 'icon': '💬', 'desc': 'Đã bình luận 10+ lần'})
        if reactions_received >= 20:
            badges.append({'name': 'Ngôi Sao', 'icon': '⭐', 'desc': 'Nhận 20+ reactions'})
        if user_messages > 0 and user_comments > 0 and user_wishes > 0:
            badges.append({'name': 'Toàn Diện', 'icon': '🏆', 'desc': 'Tham gia mọi hoạt động'})
        
        stats = {
            'messages': user_messages,
            'comments': user_comments,
            'wishes': user_wishes,
            'reactions_received': reactions_received,
            'badges': badges,
            'total_points': user_messages * 3 + user_comments * 2 + user_wishes * 5
        }
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== VOICE MESSAGES ==========
@app.route('/api/voice-messages', methods=['GET', 'POST'])
def handle_voice_messages():
    try:
        if request.method == 'GET':
            voice_messages = load_json('voice_messages.json', [])
            return jsonify(voice_messages)
        
        if request.method == 'POST':
            if 'audio' not in request.files:
                return jsonify({'success': False, 'message': 'Không có file audio'}), 400
            
            audio_file = request.files['audio']
            name = request.form.get('name', 'Ẩn danh')
            
            if audio_file:
                filename = secure_filename(f"voice_{datetime.now().strftime('%Y%m%d_%H%M%S')}.webm")
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                audio_file.save(filepath)
                
                voice_messages = load_json('voice_messages.json', [])
                
                new_voice = {
                    'id': max([v.get('id', 0) for v in voice_messages], default=0) + 1,
                    'name': name,
                    'audio_url': f"/static/uploads/{filename}",
                    'timestamp': datetime.now().isoformat()
                }
                
                voice_messages.append(new_voice)
                save_json('voice_messages.json', voice_messages)
                
                return jsonify({'success': True, 'voice': new_voice})
            
            return jsonify({'success': False, 'message': 'Lỗi upload'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ========== ADMIN ==========
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        password = data.get('password', '')
        
        if password == '12345':
            session['admin'] = True
            return jsonify({'success': True})
        
        return jsonify({'success': False, 'message': 'Mật khẩu không đúng'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    try:
        session.pop('admin', None)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/status', methods=['GET'])
def admin_status():
    try:
        return jsonify({'is_admin': session.get('admin', False)})
    except Exception as e:
        return jsonify({'is_admin': False}), 500

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'message': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e): 
    return jsonify({'success': False, 'message': 'Server error'}), 500

if __name__ == '__main__':
    # Tạo dữ liệu mẫu
    if not os.path.exists('data/preloaded_images.json'):
        sample_images = [
            {'id': 1, 'url': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800', 'description': 'Lễ khai giảng năm học'},
            {'id': 2, 'url': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', 'description': 'Hoạt động ngoại khóa'},
            {'id': 3, 'url': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800', 'description': 'Tiết học thú vị'},
            {'id': 4, 'url': 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800', 'description': 'Giờ ra chơi'},
            {'id': 5, 'url': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', 'description': 'Lễ hội văn hóa'},
            {'id': 6, 'url': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', 'description': 'Ngày hội thể thao'}
        ]
        save_json('preloaded_images.json', sample_images)
    
    # Khởi tạo files
    for filename in ['data.json', 'future.json', 'teacher_messages.json', 'comments.json', 
                     'timeline.json', 'timeline_comments.json', 'polls.json', 'achievements.json',
                     'favorites.json', 'notifications.json', 'birthdays.json', 'voice_messages.json']:
        filepath = os.path.join('data', filename)
        if not os.path.exists(filepath):
            default_data = [] if filename not in ['comments.json', 'timeline_comments.json', 'favorites.json', 'notifications.json'] else {}
            save_json(filename, default_data)
    
    print("=" * 50)
    print("🎓 Website Kỷ Yếu đang chạy!")
    print("📍 Địa chỉ: http://localhost:5000")
    print("🔑 Admin password: 12345")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
