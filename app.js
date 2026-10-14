import { roles, skillOptions, interestOptions, priorityOptions } from "./roles.js";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let step = 1;
let language = "en";
let latestMatches = [];

function addChoices(container, items, name, type = "checkbox") {
  container.innerHTML = items.map((item, index) => `<label><input type="${type}" name="${name}" value="${item}" ${type === "radio" && index === 0 ? "checked" : ""}><span>${item}</span></label>`).join("");
}

addChoices($("#skillChoices"), skillOptions, "skills");
addChoices($("#interestChoices"), interestOptions, "interests");
addChoices($("#priorityChoices"), priorityOptions, "priority", "radio");

function selected(name) { return $$(`[name="${name}"]:checked`).map(input => input.value); }

function profile() {
  const data = new FormData($("#profileForm"));
  return {
    course: data.get("course"), skills: selected("skills"), interests: selected("interests"),
    priority: data.get("priority"), location: data.get("location"), time: Number(data.get("time"))
  };
}

function updateStep(next) {
  step = next;
  $$(".form-step").forEach(item => item.classList.toggle("active", Number(item.dataset.step) === step));
  $("#progressLabel").textContent = `Profile ${step} of 3`;
  $("#progressBar").style.width = `${step * 33.333}%`;
  $("#backButton").classList.toggle("hidden", step === 1);
  $("#nextButton").classList.toggle("hidden", step === 3);
  $("#matchButton").classList.toggle("hidden", step !== 3);
  if (step === 3) {
    const p = profile();
    $("#profileSummary").textContent = `${p.course}; ${p.skills.length ? p.skills.join(", ") : "skills not selected yet"}; interested in ${p.interests.length ? p.interests.join(", ") : "exploring options"}; ${p.time} minutes available daily.`;
  }
}

$("#nextButton").addEventListener("click", () => {
  if (step === 1 && !selected("skills").length) return alert("Choose at least one skill so the ranking has something to compare.");
  if (step === 2 && !selected("interests").length) return alert("Choose at least one interest.");
  updateStep(Math.min(3, step + 1));
});
$("#backButton").addEventListener("click", () => updateStep(Math.max(1, step - 1)));

function scoreRole(role, p) {
  const skillMatches = role.skills.filter(skill => p.skills.includes(skill));
  const interestMatches = role.interests.filter(interest => p.interests.includes(interest));
  const priorityMatch = role.priorities.includes(p.priority);
  const courseBoost = p.course.includes("AI") && ["data-analyst", "ml-intern", "python-developer"].includes(role.id) ? 5 : 0;
  const raw = 34 + skillMatches.length * 9 + interestMatches.length * 8 + (priorityMatch ? 7 : 0) + courseBoost;
  const score = Math.min(94, raw);
  const gaps = role.skills.filter(skill => !p.skills.includes(skill)).slice(0, 2);
  return { ...role, score, skillMatches, interestMatches, priorityMatch, gaps };
}

function explanation(match) {
  const matched = match.skillMatches.length ? match.skillMatches.slice(0, 3).join(", ") : "your current foundation";
  if (language === "hi") return `Yeh role aapke ${matched} aur ${match.interestMatches[0] || "problem-solving interest"} se match karta hai. Score sirf selected answers par based hai.`;
  return `This role matches your ${matched} and interest in ${match.interestMatches[0]?.toLowerCase() || "structured work"}. The score is based only on your selected answers.`;
}

function renderResults(p) {
  latestMatches = roles.map(role => scoreRole(role, p)).sort((a, b) => b.score - a.score).slice(0, 3);
  const top = latestMatches[0];
  $("#resultSubtitle").textContent = `Based on ${p.skills.length} skills and ${p.interests.length} interests. These are starting directions—not permanent labels.`;
  $("#roleResults").innerHTML = latestMatches.map((match, index) => `
    <article class="role-result">
      <span class="rank">${index === 0 ? "BEST MATCH" : `OPTION ${index + 1}`}</span><span class="match-score">${match.score}%</span>
      <h3>${match.title}</h3><span class="salary">${match.salary}</span><div class="bar"><i style="width:${match.score}%"></i></div>
      <p class="reason">${explanation(match)}</p>
      <h4>Your matching skills</h4><div class="tags">${(match.skillMatches.length ? match.skillMatches : ["Transferable skills"]).map(item => `<span>${item}</span>`).join("")}</div>
      <h4>Skill gap to work on</h4><div class="tags">${(match.gaps.length ? match.gaps : ["Portfolio evidence"]).map(item => `<span class="gap-tag">${item}</span>`).join("")}</div>
    </article>`).join("");
  $("#planTitle").textContent = `30 days toward ${top.title}`;
  $("#timeline").innerHTML = top.tasks.map((task, index) => `<article class="week"><span>WEEK ${index + 1}</span><h3>${["Build the base", "Practise the core", "Create proof", "Apply and improve"][index]}</h3><p>${task}. Aim for ${p.time} minutes per day.</p></article>`).join("");
  $("#profileForm").classList.add("hidden");
  $("#results").classList.remove("hidden");
  $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("#profileForm").addEventListener("submit", event => { event.preventDefault(); renderResults(profile()); });
$("#editProfile").addEventListener("click", () => { $("#results").classList.add("hidden"); $("#profileForm").classList.remove("hidden"); updateStep(1); $("#advisor").scrollIntoView({ behavior: "smooth" }); });
$("#languageToggle").addEventListener("click", () => { language = language === "en" ? "hi" : "en"; $("#languageToggle").textContent = language === "en" ? "EN / हिं" : "हिं / EN"; if (latestMatches.length) renderResults(profile()); });

async function loadStatus() {
  try {
    const response = await fetch("/api/status");
    const status = await response.json();
    $("#assistantStatus").textContent = status.watsonConfigured ? "IBM watsonx Assistant is connected for this deployment." : "Local guidance mode is active. Watson can be connected safely on the server.";
    return status.watsonConfigured;
  } catch { return false; }
}
let watsonConfigured = false;
loadStatus().then(value => { watsonConfigured = value; });

$("#chatForm").addEventListener("submit", async event => {
  event.preventDefault();
  const input = $("#chatInput"); const reply = $("#chatReply"); const question = input.value.trim();
  if (!question || !latestMatches.length) return;
  reply.classList.remove("hidden"); reply.textContent = "Thinking…";
  if (watsonConfigured) {
    try {
      const response = await fetch("/api/watson/message", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: question }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      reply.textContent = data.reply;
      return;
    } catch { watsonConfigured = false; }
  }
  const top = latestMatches[0];
  reply.textContent = language === "hi"
    ? `${top.title} top match hai kyunki aapke selected skills mein ${top.skillMatches.slice(0,3).join(", ") || "relevant basics"} hain. Pehle ${top.gaps[0] || "portfolio project"} par kaam karo aur ${top.evidence} banao.`
    : `${top.title} is your top match because your selected profile includes ${top.skillMatches.slice(0,3).join(", ") || "relevant foundations"}. Start with ${top.gaps[0] || "a portfolio project"} and create ${top.evidence}.`;
});
