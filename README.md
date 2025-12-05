# AI-Powered RFP Management Application

This is a single-user web application designed to help a procurement manager streamline the Request for Proposal (RFP) process using AI. The application covers the entire workflow, from creating an RFP with natural language to receiving an AI-powered recommendation for vendor selection.

## 1. Project Setup

### a. Prerequisites

- **Node.js:** v18.x or later
- **MongoDB:** A running MongoDB instance. A free cluster from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) is recommended.
- **API Keys:**
  - **Google Gemini:** A free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
  - **SendGrid:** A free account and API key from [SendGrid](https://signup.sendgrid.com/).

### b. Install Steps

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  **Install Backend Dependencies:**
    ```sh
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies:**
    ```sh
    cd ../frontend
    npm install
    ```

### c. How to Configure Email Sending/Receiving

**Sending:**
1.  Sign up for a free SendGrid account.
2.  Verify a "Single Sender Identity" under **Settings > Sender Authentication**. This proves you own the email address you want to send from.
3.  Create an API Key under **Settings > API Keys**.
4.  In the `backend` directory, create a file named `.env` and add your SendGrid API key and verified email address to it:
    ```
    SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
    FROM_EMAIL=your.verified.email@example.com
    ```

**Receiving (for a live deployment):**
The application is designed to receive real email replies via a webhook. In a live environment, you would:
1.  Authenticate a domain you own with SendGrid.
2.  Configure SendGrid's **Inbound Parse** feature to point to your deployed backend's webhook URL (e.g., `https://your-app.com/api/email/receive`).

For local development, this feature is simulated via a form in the frontend, as real emails cannot reach a `localhost` server.

### d. How to Run Everything Locally

1.  **Configure Environment Variables:** In the `backend` directory, create a `.env` file and populate it with your keys as shown in the `.env.example` file.

2.  **Start the Backend Server:**
    ```sh
    cd backend
    npm run dev
    ```
    The backend will be running on `http://localhost:5000`.

3.  **Start the Frontend Server:** Open a **new terminal**, navigate to the `frontend` directory, and run:
    ```sh
    cd frontend
    npm start
    ```
    Your browser will open to `http://localhost:3000`, and the application will be ready to use.

### e. Seed Data or Initial Scripts

No seed data is required. The application allows you to add vendors and create RFPs directly through the user interface.

---

## 2. Tech Stack

- **Frontend:** React.js, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **AI Provider:** Google Gemini API (`gemini-2.5-flash` model)
- **Email Solution:** SendGrid API

---

## 3. API Documentation

The backend API is structured RESTfully. All endpoints are relative to `http://localhost:5000`.

#### Main Endpoints:

- **`POST /rfps/create-from-text`**: Creates a new RFP from a natural language string.
  - **Request Body:** `{ "naturalLanguageRequest": "I need 20 laptops..." }`
  - **Success Response (200):** The full RFP JSON object.

- **`POST /rfps/:id/send`**: Sends an RFP to a list of vendors.
  - **Request Body:** `{ "vendorIds": ["vendorId1", "vendorId2"] }`
  - **Success Response (200):** `"RFP sent successfully!"`

- **`POST /api/email/receive`**: Webhook for receiving vendor email replies.
  - **Request Body:** `multipart/form-data` containing `from`, `to`, and `text` fields.
  - **Success Response (200):** `"Proposal received and processed."`

- **`POST /rfps/:id/recommendation`**: Generates an AI-powered analysis of all proposals for an RFP.
  - **Success Response (200):** `{ "summary": "...", "recommendedVendor": "..." }`

- **`POST /vendors/add`**: Adds a new vendor.
  - **Request Body:** `{ "name": "Vendor Name", "email": "vendor@email.com" }`
  - **Success Response (200):** The new vendor JSON object.

---

## 4. Decisions & Assumptions

### a. Key Design Decisions

- **AI Model:** Initially planned to use OpenAI, but switched to **Google Gemini** to leverage its more generous free tier, making the project more accessible for evaluation without requiring a paid account.
- **Email Receiving:** For local development, a **"Simulate Vendor Reply" form** was added to the frontend. This was a crucial decision to allow for easy, end-to-end testing of the proposal and recommendation workflow without requiring the evaluator to set up complex `ngrok` tunnels or DNS configurations.
- **Data Modeling:** A relational approach was taken within MongoDB. `Proposals` link `RFPs` and `Vendors` via ObjectIDs, creating a normalized structure that is efficient and avoids data duplication.
- **Architecture:** A clean separation between the `frontend` and `backend` was maintained. The frontend further uses a `services` layer to abstract all API calls, keeping component logic clean and focused on the UI.

### b. Assumptions

- **Vendor Replies:** It was assumed that the core details of a vendor's proposal (price, warranty, etc.) would be present in the text body of their email reply. The system does not currently parse attachments.
- **AI Reliability:** The system assumes that the LLM, when prompted correctly, will consistently return a valid JSON object. The prompts have been engineered to be as robust as possible to ensure this.
- **Single-User Context:** All features were built for a single-user experience, as specified by the non-goals. There is no user authentication or multi-tenancy.
