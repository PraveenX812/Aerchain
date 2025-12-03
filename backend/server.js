const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const vendorsRouter = require('./routes/vendors');
app.use('/vendors', vendorsRouter);

const rfpsRouter = require('./routes/rfps');
app.use('/rfps', rfpsRouter);

const emailRouter = require('./routes/email');
app.use('/api/email', emailRouter);

const proposalsRouter = require('./routes/proposals');
app.use('/proposals', proposalsRouter);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
