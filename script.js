let audioCtx;
let zenStartTime, zenInterval;
let count = 0;

async function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
}

function playSound(effect) {
    initAudio();
    if (effect === 'pop') {
        const sound = document.getElementById('pop-sfx');
        sound.currentTime = 0; sound.play();
    } else {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        if (effect === 'burst') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.8, audioCtx.currentTime); 
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } else if (effect === 'click') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(1600, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start(); osc.stop(audioCtx.currentTime + 0.05);
        }
    }
}

function setMood(mood) {
    const root = document.documentElement;
    const moods = {
        'aurora': ['#ff7eb3', '#8e44ad', '#fd79a8', '#6c5ce7'],
        'sunset': ['#ff4e50', '#f9d423', '#e67e22', '#d35400'],
        'ocean':  ['#1abc9c', '#2980b9', '#3498db', '#16a085'],
        'midnight': ['#00b894', '#0984e3', '#2d3436', '#6c5ce7'],
        'cyber':  ['#fdcb6e', '#e84393', '#00cec9', '#d63031']
    };
    const colors = moods[mood];
    root.style.setProperty('--color-1', colors[0]);
    root.style.setProperty('--color-2', colors[1]);
    root.style.setProperty('--color-3', colors[2]);
    root.style.setProperty('--color-4', colors[3]);
}

function toggleZen() {
    initAudio();
    const isZen = document.body.classList.toggle('zen-active');
    const timerDisplay = document.getElementById('zen-timer');
    const btn = document.getElementById('zen-btn');
    if (isZen) {
        btn.textContent = "Exit Zen";
        timerDisplay.style.display = 'block'; 
        zenStartTime = Date.now();
        zenInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - zenStartTime) / 1000);
            const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const s = String(elapsed % 60).padStart(2, '0');
            timerDisplay.textContent = `Session: ${m}:${s}`;
        }, 1000);
    } else {
        btn.textContent = "Zen Mode";
        timerDisplay.style.display = 'none'; 
        clearInterval(zenInterval);
    }
}

// BUBBLES
function createBubble(text, sfx = true) {
    if (sfx) playSound('pop');
    const bubble = document.createElement('div');
    bubble.className = 'note-bubble';
    bubble.textContent = text;
    const size = Math.min(250, Math.max(120, 100 + (text.length * 4)));
    bubble.style.width = bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.random() * 80 + 10}%`; 
    bubble.style.top = `${Math.random() * 80 + 10}%`;
    bubble.onclick = (e) => {
        e.stopPropagation(); playSound('burst');
        count++; document.getElementById('burst-count').textContent = count;
        localStorage.setItem('aura-count', count);
        bubble.style.transform = "scale(2.5)"; bubble.style.opacity = "0";
        setTimeout(() => { bubble.remove(); saveNotes(); }, 200);
    };
    document.getElementById('notes-page').appendChild(bubble);
    saveNotes();
}

// TO-DO
function addTask(text, isCompleted = false) {
    const list = document.getElementById('todo-list');
    const li = document.createElement('li');
    li.className = isCompleted ? 'todo-item completed' : 'todo-item';
    li.innerHTML = `<div class="check-btn"></div><span class="todo-text">${text}</span><span class="delete-task">×</span>`;
    li.querySelector('.check-btn').onclick = () => { li.classList.toggle('completed'); saveTodos(); };
    li.querySelector('.delete-task').onclick = () => { playSound('burst'); li.remove(); saveTodos(); };
    list.appendChild(li);
    saveTodos();
}

function saveNotes() {
    const texts = Array.from(document.querySelectorAll('.note-bubble')).map(b => b.textContent);
    localStorage.setItem('aura-thoughts', JSON.stringify(texts));
}

function saveTodos() {
    const items = Array.from(document.querySelectorAll('.todo-item')).map(li => ({
        text: li.querySelector('.todo-text').textContent,
        completed: li.classList.contains('completed')
    }));
    localStorage.setItem('aura-todos', JSON.stringify(items));
}

window.onload = () => {
    count = localStorage.getItem('aura-count') || 0;
    document.getElementById('burst-count').textContent = count;
    const savedNotes = JSON.parse(localStorage.getItem('aura-thoughts') || "[]");
    savedNotes.forEach(t => createBubble(t, false));
    const savedTodos = JSON.parse(localStorage.getItem('aura-todos') || "[]");
    savedTodos.forEach(t => addTask(t.text, t.completed));
    
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString();
        const hr = now.getHours();
        document.getElementById('greeting').textContent = hr < 12 ? "Good Morning, Khushi." : "Good Evening, Khushi.";
    }, 1000);
};

document.getElementById('add-note-btn').onclick = () => {
    const input = document.getElementById('note-input');
    if (input.value.trim()) { createBubble(input.value.trim()); input.value = ""; }
};
document.getElementById('add-todo-btn').onclick = () => {
    const input = document.getElementById('todo-input');
    if (input.value.trim()) { addTask(input.value.trim()); input.value = ""; }
};
document.getElementById('note-input').addEventListener('keydown', (e) => { if (e.key.length === 1 || e.key === "Backspace") playSound('click'); });