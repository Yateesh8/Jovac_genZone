// ================== Theme: Dark/Light ==================

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  const toggle = document.getElementById("themeToggle");
  if (toggle) toggle.checked = true;
}
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("change", function () {
    const isDark = this.checked;
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

// ================== DOMContentLoaded HANDLER ==================
document.addEventListener('DOMContentLoaded', function () {

  // ----------- SIGNUP HANDLER (signup.html) ------------
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fullNameElem = document.getElementById('fullName');
      const usernameElem = document.getElementById('username');
      const contactElem = document.getElementById('contact');
      const passwordElem = document.getElementById('password');
      const confirmPasswordElem = document.getElementById('confirmPassword');
      if (!fullNameElem || !usernameElem || !contactElem || !passwordElem || !confirmPasswordElem) {
        alert("Signup input missing!");
        return;
      }
      const fullName = fullNameElem.value.trim();
      const username = usernameElem.value.trim();
      const emailOrPhone = contactElem.value.trim();
      const password = passwordElem.value;
      const confirmPassword = confirmPasswordElem.value;
      if (!fullName || !username || !emailOrPhone || !password || !confirmPassword) {
        alert("Please fill all fields.");
        return;
      }
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
      try {
        const res = await fetch('http://localhost:5500/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, username, emailOrPhone, password })
        });
        const result = await res.json();
        if (res.ok) {
          alert("Signup successful! Please login.");
          window.location.href = "signin.html";
        } else {
          alert(result.message || "Signup failed.");
        }
      } catch (error) {
        console.error('Signup error:', error);
        alert("Something went wrong during signup.");
      }
    });
  }

  // ----------- LOGIN HANDLER (signin.html) -------------
  const loginForm = document.querySelector('.login-form');
  if (loginForm && !signupForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const identifierElem = document.getElementById('loginIdentifier');
      const passwordElem = document.getElementById('loginPassword');
      if (!identifierElem || !passwordElem) {
        alert("Login input missing!");
        return;
      }
      const identifier = identifierElem.value.trim();
      const password = passwordElem.value.trim();
      if (!identifier || !password) {
        alert("Please enter both username/email and password.");
        return;
      }
      try {
        const res = await fetch('http://localhost:5500/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const result = await res.json();
        if (res.ok) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('userId', result.user._id);
          localStorage.setItem('username', result.user.username);
          window.location.href = 'chat.html';
        } else {
          alert(result.message || 'Login failed.');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Something went wrong.');
      }
    });
  }

  // ----------- Hamburger/Profile Sidebar/Logout -------------
  const hamburgerToggle = document.getElementById('hamburgerToggle');
  if (hamburgerToggle) {
    hamburgerToggle.addEventListener('click', function () {
      const sidebar = document.getElementById('profileSidebar');
      if (sidebar) {
        sidebar.style.display = sidebar.style.display === "none" ? "block" : "none";
        updateProfileSidebar();
      }
    });
  }
  const sidebarLogoutBtn = document.getElementById('sidebarLogout');
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', function () {
      localStorage.clear();
      window.location.href = "signin.html";
    });
  }

  // ----------- Password SHOW/HIDE -------------
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("loginPassword");
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", function () {
      const isText = passwordInput.type === "text";
      passwordInput.type = isText ? "password" : "text";
      this.textContent = isText ? "Show" : "Hide";
    });
  }

  // ----------- FRIEND SYSTEM, CHAT, REQUESTS (chat.html only) -------------
  if (window.location.pathname.includes('chat.html')) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    if (!token) window.location.href = 'signin.html';

    // Add Friend Button (reload sidebar on success)
    const addFriendBtn = document.getElementById('addFriendBtn');
    if (addFriendBtn) {
      addFriendBtn.addEventListener('click', async () => {
        const usernameToAddElem = document.getElementById('friendIdInput');
        if (!usernameToAddElem) return alert("No input found!");
        const usernameToAdd = usernameToAddElem.value.trim();
        if (!usernameToAdd) return alert("Enter a username to add.");
        try {
          const res = await fetch('http://localhost:5500/api/users/add-friend', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username: usernameToAdd })
          });
          const data = await res.json();
          alert(data.message || "Friend request sent!");
          updateProfileSidebar();
        } catch (err) {
          console.error(err);
          alert("Failed to add friend.");
        }
      });
    }
  }
});

// =============== Update Profile Sidebar (DRY, Baked-in Label Fix, No Duplicates) ===============
function updateProfileSidebar() {
  const username = localStorage.getItem('username');
  const usernameElem = document.getElementById('sidebarUsername');
  if (usernameElem) usernameElem.textContent = username || '';
  const ul = document.getElementById('sidebarFriends');
  if (!ul) return;
  ul.innerHTML = ""; // clear at top, before ANY fetch returns

  // Only if token
  if (!localStorage.getItem('token')) return;

  fetch("http://localhost:5500/api/users/friends", {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
  .then(res => res.json())
  .then(friends => {
    if (Array.isArray(friends) && friends.length > 0) {
      const friendsLabel = document.createElement('div');
      friendsLabel.textContent = "Friends";
      friendsLabel.style = "color:#56c3fe;font-weight:550;margin-bottom:2px;";
      ul.appendChild(friendsLabel);
      friends.forEach(friend => {
        const li = document.createElement('li');
        li.textContent = friend.username;
        ul.appendChild(li);
      });
    }
    // Requests after friends
    fetch("http://localhost:5500/api/users/friend-requests", {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(requests => {
      // Sent
      if (requests.sent && requests.sent.length > 0) {
        const sentLabel = document.createElement('div');
        sentLabel.textContent = "Requests Sent:";
        sentLabel.style = "margin-top:10px;color:#fbbf24;font-weight:bold;";
        ul.appendChild(sentLabel);
        requests.sent.forEach(user => {
          const li = document.createElement('li');
          li.textContent = user.username + " (Request sent)";
          li.style.color = "#fbbf24";
          ul.appendChild(li);
        });
      }
      // Received
      if (requests.received && requests.received.length > 0) {
        const recvdLabel = document.createElement('div');
        recvdLabel.textContent = "Requests Received:";
        recvdLabel.style = "margin-top:12px;color:#60c46f;font-weight:bold;";
        ul.appendChild(recvdLabel);
        requests.received.forEach(user => {
          const li = document.createElement('li');
          li.innerHTML = `
            ${user.username} 
            <button style="margin-left:7px; background:#39cf8d;color:#fff;border:none;border-radius:4px;cursor:pointer;" onclick="acceptReq('${user._id}', this)">Accept</button>
            <button style="margin-left:4px; background:#ee222e;color:#fff;border:none;border-radius:4px;cursor:pointer;" onclick="rejectReq('${user._id}',this)">Reject</button>
          `;
          ul.appendChild(li);
        });
      }
    });
  });
}

// Accept/Reject friend request handlers (global for inline button)
window.acceptReq = function(senderId, btn) {
  fetch("http://localhost:5500/api/users/accept-friend", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${localStorage.getItem('token')}` 
    },
    body: JSON.stringify({ senderId })
  })
  .then(r=>r.json()).then(d=>{
    alert(d.message || "Accepted!");
    updateProfileSidebar();
  });
};

window.rejectReq = function(senderId, btn) {
  fetch("http://localhost:5500/api/users/reject-friend", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${localStorage.getItem('token')}` 
    },
    body: JSON.stringify({ senderId })
  })
  .then(r=>r.json()).then(d=>{
    alert(d.message || "Rejected.");
    updateProfileSidebar();
  });
};

// =========== NEW: Friends ke saath Direct Chat (Select, Load, Send) ===========

// Store selected friend userId globally
let selectedFriendId = null;
let selectedFriendUsername = null;
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');

// 1. Listen on sidebar friends (li) for click
document.addEventListener('DOMContentLoaded', function () {
  // Wait for DOM Ready, try after sidebar populated
  setTimeout(() => {
    enableFriendClick();
  }, 800); // after profile sidebar loaded (tune 800ms up/down as per UX)

  // Re-enable click whenever profile sidebar updates
  window.updateProfileSidebar_OLD = window.updateProfileSidebar;
  window.updateProfileSidebar = function() {
    window.updateProfileSidebar_OLD();
    setTimeout(enableFriendClick, 500);
  };
});

// Main function for click-to-chat
function enableFriendClick() {
  const ul = document.getElementById('sidebarFriends');
  if (!ul) return;
  const items = ul.querySelectorAll('li');
  items.forEach(li => {
    li.style.cursor = "pointer";
    li.onclick = function() {
      // Avoid friend label click
      const uname = li.textContent.split('(')[0].trim();
      if (!uname || uname === "Friends") return;
      selectFriendToChat(uname);
    };
  });
}

// Actual selection handler
async function selectFriendToChat(uname) {
  selectedFriendUsername = uname;
  selectedFriendId = await getUserIdByUsername(uname);
  document.getElementById('chatWith').textContent = "Chat with: " + uname;
  //document.getElementById('chatInputArea').style.display = "flex";
  loadMessages(selectedFriendId);
}

// Helper: Fetch userId by username (API)
async function getUserIdByUsername(uname) {
  // Quick fetch (must have API in userRoutes.js)
  const res = await fetch(`http://localhost:5500/api/users/username/${encodeURIComponent(uname)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const user = await res.json();
  return user._id;
}

// 2. Load Messages between users
const socket = io('http://localhost:5500');
if (userId && socket) socket.emit('join', userId);

async function loadMessages(friendId) {
  if (!friendId) return;
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = "<div style='text-align:center;'>Loading...</div>";
  try {
    const res = await fetch(`http://localhost:5500/api/messages/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { messages } = await res.json();
    // Show all messages!
    chatMessages.innerHTML = messages.map(m => `
      <div class="msg ${m.sender === userId ? 'sent' : 'received'}">
        <span>${m.content}</span>
        <div class="msg-time">${new Date(m.createdAt).toLocaleTimeString()}</div>
      </div>
    `).join('');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (e) {
    chatMessages.innerHTML = "<i>Failed to load messages</i>";
  }
}

// 3. Send message (on button click) -- Socket.IO version for live chat!
document.addEventListener('DOMContentLoaded', function() {
  const sendBtn = document.getElementById('sendBtn');
  const messageInput = document.getElementById('messageInput');
  if (!sendBtn || !messageInput) return;

  sendBtn.onclick = async function() {
    const msg = messageInput.value.trim();
    if (!msg || !selectedFriendId) return;
    try {
      // 1. REST API (DB save)
      await fetch("http://localhost:5500/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ receiver: selectedFriendId, content: msg })
      });
      // 2. SOCKET.IO (realtime send)
      socket.emit('sendMessage', {
        receiverId: selectedFriendId,
        message: {
          sender: userId,
          receiver: selectedFriendId,
          content: msg,
          createdAt: new Date()
        }
      });
      // 3. UI clear + reload
      messageInput.value = "";
      loadMessages(selectedFriendId);
    } catch (e) {
      alert("Could not send.");
    }
  };
  // Enter key shortcut
  messageInput.addEventListener('keydown', function(e){
    if (e.key === "Enter") sendBtn.onclick();
  });
});

// Socket.io: listen for real-time new message
if (typeof socket !== "undefined" && socket) {
  socket.on('receiveMessage', (msg) => {
    // Only reload if you are chatting with sender
    if (selectedFriendId && selectedFriendId === msg.sender) {
      loadMessages(selectedFriendId);
    }
  });
}

// Chat media send
document.getElementById('chatForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) return alert("Please login!");

  const formData = new FormData();
  const msg = document.getElementById('chatMessageInput').value;
  const file = document.getElementById('mediaInput').files[0];

  // Receiver must exist
  if (!selectedFriendId) return alert("Select a friend first!");

  formData.append("receiver", selectedFriendId);
  formData.append("content", msg);

  if (file) {
    formData.append("media", file);
  }

  const res = await fetch('http://localhost:5500/api/messages/send', {
    method: 'POST',
    body: formData,
    headers: { "Authorization": `Bearer ${token}` }
  });

  const data = await res.json();
  console.log(data);

  if (res.ok) {
    document.getElementById('chatMessageInput').value = "";
    document.getElementById('mediaInput').value = "";
    loadMessages(selectedFriendId);
  }
});


// Fetch and display friend stories
async function loadStories() {
  const res = await fetch('http://localhost:5500/api/auth/story/feed', {
    headers: { /* 'Authorization': 'Bearer ' + token */ }
  });
  const data = await res.json();
  const feed = document.getElementById('storyFeed');
  feed.innerHTML = '';
  data.stories.forEach(story => {
    const el = document.createElement('div');
    el.innerHTML = `
      <h3>${story.owner.username}:</h3>
      ${story.mediaType === 'image' ? `<img src="${story.mediaUrl}" width="150"/>` : `
      <video src="${story.mediaUrl}" width="200" controls></video>`}
      ${story.caption ? `<p>${story.caption}</p>` : ''}
    `;
    feed.appendChild(el);
  });
} // Call loadStories() on page load or after upload

document.getElementById('storyForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) return alert("Please login again!");
  const form = e.target;
  const formData = new FormData(form);

  // Always set ONLY the "Authorization" header for FormData uploads (NO Content-Type header!)
  const res = await fetch('http://localhost:5500/api/story/add', {
    method: 'POST',
    body: formData,
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  if (res.ok) {
    alert(data.message || "Story uploaded!");
    // Optionally reload feed here
  } else {
    alert(data.error || "Story upload failed!");
  }
});

// msg send button
document.getElementById("chatMessageInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    document.querySelector("#chatForm button[type='submit']").click();
  }
});
