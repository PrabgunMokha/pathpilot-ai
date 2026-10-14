# PathPilot AI

PathPilot AI is a multilingual career-guidance prototype for students who are unsure which entry-level role fits their current skills. It ranks three realistic starting roles, shows the matching logic and skill gaps, and generates a practical 30-day plan.

![PathPilot AI website preview](docs/pathpilot-preview.png)

**Live demo:** Add your Vercel or Netlify URL here after publishing.

## Why this project

Job portals show vacancies and learning platforms show courses, but students still have to decide which role to prepare for. PathPilot turns a small student profile into a clear starting direction without pretending to guarantee employment.

## Features

- Three ranked entry-level role recommendations
- Transparent score based on skill, interest and priority overlap
- Missing-skill guidance for every recommended role
- Personal four-week action plan
- English and Hinglish explanations
- Responsive interface for phone and laptop
- Optional IBM watsonx Assistant connection
- No login and no personal data stored

## How the recommendation works

The browser converts the selected skills, interests and career priority into features. Each role has its own skill and interest profile. A weighted similarity score ranks the roles:

- matching skill: 9 points
- matching interest: 8 points
- matching main priority: 7 points
- relevant course boost: 5 points

The interface displays the actual matched fields and missing skills so the result is explainable. This is a prototype recommendation model, not a hiring decision or job guarantee.

## Run locally

Requirements: Node.js 18 or newer.

```bash
git clone https://github.com/YOUR_USERNAME/pathpilot-ai.git
cd pathpilot-ai
npm start
```

Open `http://localhost:3000` in your browser. The main recommendation flow works without any API key or dependency installation.

## Optional IBM watsonx Assistant setup

Watson is connected through the Node server so the API key is never placed in browser code.

1. Create an IBM watsonx Assistant.
2. Copy `.env.example` to `.env`.
3. Add your Assistant URL, Assistant ID and API key to `.env`.
4. Run `npm start`. The server loads the local `.env` file automatically.

Environment variable names:

```text
WATSON_ASSISTANT_URL
WATSON_ASSISTANT_ID
WATSON_API_KEY
```

The `.env` file is ignored by Git. Never commit a real key. If Watson is not configured, the app automatically uses its local career explanation mode.

## Deploy

### Vercel

1. Import this GitHub repository in Vercel.
2. Keep the framework preset as **Other**.
3. Leave the build command empty; `vercel.json` serves the files from `public/`.
4. Add Watson environment variables only if you want the optional live assistant.
5. Deploy and paste the URL into this README and your submission form.

### Netlify

1. Import this GitHub repository in Netlify.
2. Netlify reads `netlify.toml`: the publish directory is `public` and serverless functions are configured automatically.
3. Add Watson environment variables only if needed.
4. Deploy and use the generated URL as the final project link.

### Render

1. Create a new **Web Service** from this GitHub repository.
2. Runtime: **Node**.
3. Start command: `npm start`.
4. Add the three Watson environment variables only if you want the optional integration.
5. Deploy and place the resulting URL in the **Live demo** line above and in your project submission form.

This repository also includes `render.yaml`, so Render can detect the basic service configuration automatically. Secret values still have to be added privately in Render's environment settings.

### Railway or another Node host

Use `npm start` as the start command. The app reads the host-provided `PORT` automatically.

> GitHub Pages can run the local recommendation interface, but not the optional server-side Watson connector. Use Vercel, Netlify, Render or Railway for the complete version.

## Project structure

```text
pathpilot-ai/
├── api/                  # Vercel serverless endpoints
├── lib/                  # shared secure Watson connector
├── netlify/functions/    # Netlify serverless endpoints
├── public/
│   ├── index.html        # page and form structure
│   ├── styles.css        # responsive design
│   ├── roles.js          # role and skill dataset
│   └── app.js            # matching, plans and interactions
├── server.js             # static server and optional Watson proxy
├── vercel.json           # Vercel routing
├── netlify.toml          # Netlify publishing and function routing
├── .env.example          # safe placeholder configuration
├── .gitignore            # blocks secrets and generated files
├── package.json
└── README.md
```

## Privacy and security

- No API keys are included in this repository.
- `.env` and common deployment folders are excluded by `.gitignore`.
- Profile answers are processed in the browser and are not written to a database.
- Watson credentials, when used, remain server-side.
- Before pushing, you can check tracked files with a secret scanner such as Gitleaks.

## Limitations

- The role dataset is intentionally small for the first prototype.
- Salary ranges are broad examples and should be verified against current listings.
- The score is a transparent similarity score, not a trained hiring model.
- Recommendations should support—not replace—research or advice from a career counsellor.

## Future work

- Validate role profiles using real entry-level job descriptions
- Test the recommendations with students and collect feedback
- Add resume-to-skill extraction with informed consent
- Compare the rule-based baseline with a trained classification model
- Add more Indian languages and regional role data

## Author

**Prabgun Mokha**  
4th Year, B.Tech Artificial Intelligence and Data Science  
Dr. Akhilesh Das Gupta Institute of Professional Studies

## License

MIT
