<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Messenger Test Client</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .message-list {
            height: calc(100vh - 180px);
            overflow-y: auto;
        }
    </style>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h1 class="text-2xl font-bold mb-4 text-gray-800">Chat Messenger Test</h1>
            
            <!-- Login Form -->
            <div id="loginForm" class="mb-6">
                <input type="text" id="username" placeholder="Enter username" 
                    class="w-full p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <button onclick="login()" 
                    class="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-200">
                    Join Chat
                </button>
            </div>

            <!-- Chat Interface (Hidden by default) -->
            <div id="chatInterface" class="hidden">
                <div id="messageList" class="message-list mb-4 space-y-2"></div>
                
                <div class="flex gap-2">
                    <input type="text" id="messageInput" placeholder="Type a message..." 
                        class="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onkeyup="handleTyping(event)">
                    <button onclick="sendMessage()" 
                        class="bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-700 transition duration-200">
                        Send
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let socket = null;
        let typingTimeout = null;

        function login() {
            const username = document.getElementById('username').value.trim();
            if (!username) {
                alert('Please enter a username');
                return;
            }

            // Connect to socket.io server
            socket = io('http://localhost:8000');

            // Handle connection events
            socket.on('connect', () => {
                console.log('Connected to server');
                socket.emit('join', username);
                
                // Show chat interface
                document.getElementById('loginForm').classList.add('hidden');
                document.getElementById('chatInterface').classList.remove('hidden');
            });

            // Handle incoming messages
            socket.on('message', (message) => {
                addMessage(message);
            });

            // Handle user joined/left messages
            socket.on('userJoined', (message) => {
                addSystemMessage(message);
            });

            socket.on('userLeft', (message) => {
                addSystemMessage(message);
            });

            // Handle typing indicators
            socket.on('userTyping', ({ user, isTyping }) => {
                handleTypingIndicator(user, isTyping);
            });
        }

        function sendMessage() {
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value.trim();
            
            if (message && socket) {
                socket.emit('sendMessage', message);
                messageInput.value = '';
            }
        }

        function handleTyping(event) {
            if (event.key === 'Enter') {
                sendMessage();
                return;
            }

            if (socket) {
                socket.emit('typing', true);
                
                // Clear existing timeout
                if (typingTimeout) {
                    clearTimeout(typingTimeout);
                }

                // Set new timeout
                typingTimeout = setTimeout(() => {
                    socket.emit('typing', false);
                }, 1000);
            }
        }

        function addMessage(message) {
            const messageList = document.getElementById('messageList');
            const div = document.createElement('div');
            
            div.className = `p-3 rounded-lg ${
                message.user === document.getElementById('username').value
                    ? 'bg-indigo-100 ml-auto'
                    : 'bg-gray-100'
            } max-w-[80%]`;
            
            div.innerHTML = `
                <div class="text-sm text-gray-600">${message.user}</div>
                <div class="text-gray-800">${message.text}</div>
                <div class="text-xs text-gray-500 text-right">
                    ${new Date(message.timestamp).toLocaleTimeString()}
                </div>
            `;
            
            messageList.appendChild(div);
            messageList.scrollTop = messageList.scrollHeight;
        }

        function addSystemMessage(message) {
            const messageList = document.getElementById('messageList');
            const div = document.createElement('div');
            
            div.className = 'text-center text-sm text-gray-500 my-2';
            div.textContent = message;
            
            messageList.appendChild(div);
            messageList.scrollTop = messageList.scrollHeight;
        }

        function handleTypingIndicator(user, isTyping) {
            const existingIndicator = document.getElementById(`typing-${user}`);
            
            if (isTyping && !existingIndicator) {
                const messageList = document.getElementById('messageList');
                const div = document.createElement('div');
                
                div.id = `typing-${user}`;
                div.className = 'text-sm text-gray-500 italic';
                div.textContent = `${user} is typing...`;
                
                messageList.appendChild(div);
                messageList.scrollTop = messageList.scrollHeight;
            } else if (!isTyping && existingIndicator) {
                existingIndicator.remove();
            }
        }
    </script>
</body>
</html>
