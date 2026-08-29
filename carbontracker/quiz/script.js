let questions = [];
let currentQuestion = 0;
let answers = {};

const questionText = document.getElementById("question");
const optionsContainer = document.getElementById("options");
const nextButton = document.getElementById("nextBtn");
const progressText = document.getElementById("progress");
const resultContainer = document.getElementById("result");
const categoryStepsEl = document.getElementById("categorySteps");

// Display info for each question category.
// Used to break the quiz into short, labelled sections
// so it doesn't feel like one long list of questions.
const CATEGORY_META = {
    transport:   { label: "Transport",       icon: "🚗" },
    electricity: { label: "Electricity",     icon: "⚡" },
    cooking:     { label: "Cooking & Fuel",  icon: "🔥" },
    shopping:    { label: "Shopping",        icon: "🛍️" },
    food:        { label: "Food",            icon: "🍽️" }
};


// Load questions from JSON
fetch("questions.json")
    .then(response => response.json())
    .then(data => {
        questions = data.questions;
        showQuestion();
    })
    .catch(error => {
        console.error("Error loading questions:", error);
        questionText.textContent = "Unable to load questions.";
    });


// Display current question
function showQuestion() {

    const q = questions[currentQuestion];

    questionText.textContent = q.question;

    // Show progress *within the current section* (e.g. "Electricity —
    // Question 1 of 2") rather than just a flat overall count, so each
    // category reads as its own short mini-quiz.
    const meta = CATEGORY_META[q.category] || { label: q.category, icon: "" };

    const indicesInCategory = questions
        .map((question, index) => (question.category === q.category ? index : -1))
        .filter(index => index !== -1);

    const posInCategory = indicesInCategory.indexOf(currentQuestion) + 1;

    progressText.textContent =
        `${meta.icon} ${meta.label} — Question ${posInCategory} of ${indicesInCategory.length}`;

    renderCategorySteps(q.category);

    optionsContainer.innerHTML = "";

    q.options.forEach((option, index) => {

        const button = document.createElement("button");

        button.className = "option";
        button.textContent = option.text;

        button.onclick = () => selectOption(index, option.value);

        optionsContainer.appendChild(button);
    });

    nextButton.disabled = true;
}


// Render the row of category chips at the top of the quiz, marking
// which sections are done, which is active, and which are upcoming.
function renderCategorySteps(currentCategory) {

    if (!categoryStepsEl) return;

    // Unique categories, in the order they first appear in questions.json
    const order = [];
    questions.forEach(q => {
        if (!order.includes(q.category)) {
            order.push(q.category);
        }
    });

    categoryStepsEl.innerHTML = "";

    order.forEach(cat => {

        const meta = CATEGORY_META[cat] || { label: cat, icon: "•" };

        const catIndices = questions
            .map((q, i) => (q.category === cat ? i : -1))
            .filter(i => i !== -1);

        const lastIndexOfCategory = Math.max(...catIndices);

        let status = "upcoming";

        if (cat === currentCategory) {
            status = "active";
        } else if (lastIndexOfCategory < currentQuestion) {
            status = "done";
        }

        const chip = document.createElement("div");
        chip.className = `category-step ${status}`;
        chip.innerHTML =
            `<span class="cat-icon">${meta.icon}</span>` +
            `<span class="cat-label">${meta.label}</span>`;

        categoryStepsEl.appendChild(chip);
    });
}


// Select an answer
function selectOption(index, value) {

    const optionButtons =
        document.querySelectorAll(".option");

    optionButtons.forEach(button => {
        button.classList.remove("selected");
    });

    optionButtons[index].classList.add("selected");

    answers[questions[currentQuestion].id] = value;

    nextButton.disabled = false;
}


// Next question
nextButton.addEventListener("click", () => {

    if (currentQuestion < questions.length - 1) {

        currentQuestion++;

        showQuestion();

    } else {

        calculateFootprint();
    }
});


// Calculate final carbon footprint
function calculateFootprint() {

    // -----------------------
    // TRANSPORTATION
    // -----------------------

    const transportFactor =
        answers["transport_type"] || 0;

    const distance =
        answers["distance"] || 0;

    const travelDays =
        answers["travel_days"] || 0;

    let occupancy =
        answers["car_occupancy"] || 1;

    // Only divide by occupancy for cars
    if (transportFactor !== 0.17) {
        occupancy = 1;
    }

    // Yearly transportation emissions
    let transportFootprint =
        distance *
        travelDays *
        52 *
        transportFactor /
        occupancy;


    // -----------------------
    // FLIGHTS
    // -----------------------

    const flights =
        answers["flights"] || 0;

    // Simplified average flight:
    // 1000 km × 0.25 kg CO2e/km
    const flightFootprint =
        flights * 1000 * 0.25;


    // -----------------------
    // ELECTRICITY
    // -----------------------
    // idle_energy and hvac_usage options already store a direct
    // kg CO2e/year figure (no further multiplication needed).

    const idleEnergy =
        answers["idle_energy"] || 0;

    const hvacUsage =
        answers["hvac_usage"] || 0;

    const electricityFootprint =
        idleEnergy + hvacUsage;


    // -----------------------
    // COOKING & FUEL
    // -----------------------

    const cookingFootprint =
        answers["cooking_method"] || 0;


    // -----------------------
    // SHOPPING
    // -----------------------

    const shoppingFootprint =
        answers["shopping_habits"] || 0;


    // -----------------------
    // FOOD
    // -----------------------

    const diet =
        answers["diet"] || 0;

    const beefMutton =
        answers["beef_mutton"] || 0;

    const chicken =
        answers["chicken"] || 0;

    const fish =
        answers["fish"] || 0;

    const packagedFood =
        answers["packaged_food"] || 0;

    const restaurant =
        answers["restaurant"] || 0;


    // Meat frequency adjustments
    const meatFootprint =
        (beefMutton * 20) +
        (chicken * 8) +
        (fish * 6);


    // Total food footprint
    const foodFootprint =
        diet +
        meatFootprint +
        packagedFood +
        restaurant;


    // -----------------------
    // FINAL TOTAL
    // -----------------------

    const total =
        transportFootprint +
        flightFootprint +
        foodFootprint +
        electricityFootprint +
        cookingFootprint +
        shoppingFootprint;


    displayResult(
        transportFootprint,
        flightFootprint,
        foodFootprint,
        electricityFootprint,
        cookingFootprint,
        shoppingFootprint,
        total
    );
}


// Display result
function displayResult(
    transport,
    flights,
    food,
    electricity,
    cooking,
    shopping,
    total
) {

    // Save the results so meter.html can read them
    const results = {
        transport: transport,
        flights: flights,
        food: food,
        electricity: electricity,
        cooking: cooking,
        shopping: shopping,
        total: total,
        tonnes: total / 1000
    };

    sessionStorage.setItem(
        "carbonResults",
        JSON.stringify(results)
    );

    // Send the user to the meter page instead of
    // showing the result here
    window.location.href = "../meter/meter.html";
}