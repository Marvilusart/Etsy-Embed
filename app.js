// Script to handle lyric uploads, character extraction, storyboard rendering,
// localStorage persistence, and animation prompt generation.
document.addEventListener('DOMContentLoaded', () => {
    let characters = [];
    let scenes = [];

    const fileInput = document.getElementById('file-input');
    const charactersContainer = document.getElementById('characters-container');
    const storyboardContainer = document.getElementById('storyboard-container');

    function saveState() {
        localStorage.setItem('characters', JSON.stringify(characters));
        localStorage.setItem('scenes', JSON.stringify(scenes));
    }

    function loadState() {
        const storedChars = localStorage.getItem('characters');
        const storedScenes = localStorage.getItem('scenes');
        if (storedChars) {
            characters = JSON.parse(storedChars);
        }
        if (storedScenes) {
            scenes = JSON.parse(storedScenes);
        }
        renderCharacters();
        renderScenes();
    }

    async function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async e => {
                if (file.name.toLowerCase().endsWith('.docx')) {
                    mammoth.extractRawText({ arrayBuffer: e.target.result })
                        .then(result => resolve(result.value))
                        .catch(err => reject(err));
                } else {
                    resolve(e.target.result);
                }
            };
            if (file.name.toLowerCase().endsWith('.docx')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    function processLyrics(text) {
        const sceneTexts = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
        scenes = sceneTexts.map(t => ({ text: t, prompt: '', loading: false }));

        const nameRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
        const names = new Set();
        sceneTexts.forEach(t => {
            const matches = t.match(nameRegex) || [];
            matches.forEach(name => names.add(name));
        });
        characters = Array.from(names).map(name => ({ name, description: '' }));

        renderCharacters();
        renderScenes();
        saveState();
    }

    async function handleFiles(event) {
        let allText = '';
        const files = Array.from(event.target.files);
        for (const file of files) {
            try {
                const text = await readFile(file);
                allText += '\n' + text;
            } catch (err) {
                console.error('Error reading file', err);
            }
        }
        if (allText.trim()) {
            processLyrics(allText);
        }
    }

    function renderCharacters() {
        charactersContainer.innerHTML = '';
        characters.forEach((char, index) => {
            const div = document.createElement('div');
            div.className = 'character-profile';
            div.dataset.index = index;
            if (char.editing) {
                div.innerHTML = `
                    <input type="text" class="edit-name" value="${char.name}">
                    <textarea class="edit-desc">${char.description || ''}</textarea>
                    <button class="save-char">Save</button>
                    <button class="cancel-char">Cancel</button>
                `;
            } else {
                div.innerHTML = `
                    <h3>${char.name}</h3>
                    <p>${char.description || ''}</p>
                    <button class="edit-char">Edit</button>
                `;
            }
            charactersContainer.appendChild(div);
        });
    }

    function renderScenes() {
        storyboardContainer.innerHTML = '';
        scenes.forEach((scene, index) => {
            const div = document.createElement('div');
            div.className = 'scene';
            const buttonContent = scene.loading ? 'Get Animation Ideas<span class="spinner"></span>' : 'Get Animation Ideas';
            div.innerHTML = `
                <p>${scene.text}</p>
                <button class="get-prompt" data-index="${index}" ${scene.loading ? 'disabled' : ''}>${buttonContent}</button>
                <div class="prompt">${scene.prompt || ''}</div>
            `;
            storyboardContainer.appendChild(div);
        });
    }

    charactersContainer.addEventListener('click', e => {
        const index = e.target.closest('.character-profile')?.dataset.index;
        if (index === undefined) return;
        if (e.target.classList.contains('edit-char')) {
            characters[index].editing = true;
            renderCharacters();
        } else if (e.target.classList.contains('save-char')) {
            const div = e.target.closest('.character-profile');
            const name = div.querySelector('.edit-name').value.trim();
            const desc = div.querySelector('.edit-desc').value.trim();
            characters[index].name = name;
            characters[index].description = desc;
            delete characters[index].editing;
            saveState();
            renderCharacters();
        } else if (e.target.classList.contains('cancel-char')) {
            delete characters[index].editing;
            renderCharacters();
        }
    });

    storyboardContainer.addEventListener('click', e => {
        if (!e.target.classList.contains('get-prompt')) return;
        const index = e.target.dataset.index;
        const scene = scenes[index];
        scene.loading = true;
        renderScenes();
        setTimeout(() => {
            scene.prompt = `Consider animating: ${scene.text.substring(0, 60)}...`;
            scene.loading = false;
            saveState();
            renderScenes();
        }, 1000);
    });

    fileInput.addEventListener('change', handleFiles);
    loadState();
});
