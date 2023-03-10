const { getUserByEmail } = require("./helpers");
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const generateRandomString = () => {
  return Math.random().toString(36).slice(-6);
};

const urlsForUser = id => {
  const urls = {};
  for (const uid in urlDatabase) {
    if (id === urlDatabase[uid].userID) {
      urls[uid] = urlDatabase[uid];
    }
  }
  return urls;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  aJ48lW: {
    id: "aJ48lW",
    email: "user2@example.com",
    password: "dishwasher-funk",
  }
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    user_id: req.session.user_id,
    urls: urlsForUser(req.session.user_id)
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    user_id: req.session.user_id
  };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const shortUrl = generateRandomString();
    urlDatabase[shortUrl] = { longURL: req.body.longURL, userID: req.session.user_id };
    res.redirect(`/urls/${shortUrl}`);
  } else {
    res.send("You are not logged in");
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    user_id: req.session.user_id,
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    res.render("urls_show", templateVars);
  } else if (req.session.user_id) {
    res.send("You do not own the URL");
  } else {
    res.redirect("/login");
  }
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send("ID does not exist");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.post("/urls/:id", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = { longURL: req.body.longURL, userID: req.session.user_id };
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    user_id: req.session.user_id
  };
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.id;
      res.redirect("/urls");
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(403);
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    user_id: req.session.user_id
  };
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  if (req.body.email === "" || req.body.password === "" || getUserByEmail(req.body.email, users)) {
    res.sendStatus(400);
  } else {
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = userId;
    res.redirect("/urls");
  }
});