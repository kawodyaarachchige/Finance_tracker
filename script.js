document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const filterCategory = document.getElementById('filter-category');
    const searchInput = document.getElementById('search');
    const ctx = document.getElementById('myChart').getContext('2d');
    const exportBtn = document.getElementById('export-btn');
    const modeToggle = document.getElementById('mode-toggle');
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let myChart;

    // Update the summary of income, expenses, and balance
    function updateSummary() {
        let income = transactions
            .filter(transaction => transaction.category === 'income')
            .reduce((acc, transaction) => acc + parseFloat(transaction.amount), 0);
        let expenses = transactions
            .filter(transaction => transaction.category === 'expense')
            .reduce((acc, transaction) => acc + parseFloat(transaction.amount), 0);
        let balance = income - expenses;
        document.getElementById('balance').innerHTML = 'Balance: $' + balance.toFixed(2);
        document.getElementById('income').innerHTML = 'Income: $' + income.toFixed(2);
        document.getElementById('expenses').innerHTML = 'Expenses: $' + expenses.toFixed(2);

        updateChart();
    }

    // Add a new transaction to the list
    function addTransaction(e) {
        e.preventDefault();

        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;

        const transaction = {
            id: generateID(),
            date,
            description,
            amount,
            category
        };

        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));

        addTransactionDOM(transaction);
        updateSummary();

        transactionForm.reset();
    }

    // Add a transaction to the DOM
    function addTransactionDOM(transaction) {
        const item = document.createElement('li');
        item.classList.add(transaction.category);
        item.innerHTML = `
            ${transaction.date} - ${transaction.description} - $${transaction.amount}
            <button id="remove" class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
        `;
        transactionList.appendChild(item);
    }

    // Remove a transaction by ID
    window.removeTransaction = function(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        init();
    };

    // Generate a unique ID for each transaction
    function generateID() {
        return Math.floor(Math.random() * 100000000);
    }

    // Initialize the application
    function init() {
        transactionList.innerHTML = '';
        transactions.forEach(addTransactionDOM);
        updateSummary();
    }

    // Filter transactions by category
    function filterTransactions() {
        const selectedCategory = filterCategory.value;
        transactionList.innerHTML = '';

        const filteredTransactions = selectedCategory === 'all'
            ? transactions
            : transactions.filter(transaction => transaction.category === selectedCategory);

        filteredTransactions.forEach(addTransactionDOM);
    }

    // Search transactions by description
    function searchTransactions() {
        const searchTerm = searchInput.value.toLowerCase();
        transactionList.innerHTML = '';

        const filteredTransactions = transactions.filter(transaction =>
            transaction.description.toLowerCase().includes(searchTerm)
        );

        filteredTransactions.forEach(addTransactionDOM);
    }

    // Toggle dark mode
    modeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        modeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // Update the chart with income and expense data
    function updateChart() {
        const monthlyData = transactions.reduce((acc, transaction) => {
            const month = transaction.date.slice(0, 7); // Extract YYYY-MM
            if (!acc[month]) {
                acc[month] = { income: 0, expense: 0 };
            }
            acc[month][transaction.category] += parseFloat(transaction.amount);
            return acc;
        }, {});

        const labels = Object.keys(monthlyData).sort();
        const incomeData = labels.map(label => monthlyData[label].income);
        const expenseData = labels.map(label => monthlyData[label].expense);

        if (myChart) {
            myChart.destroy();
        }

        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Export transactions to CSV
    function exportToCSV() {
        const csvRows = [];
        const headers = ['Date', 'Description', 'Amount', 'Category'];
        csvRows.push(headers.join(','));

        transactions.forEach(transaction => {
            const row = [
                transaction.date,
                transaction.description,
                transaction.amount,
                transaction.category
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    init();

    // Event listeners
    transactionForm.addEventListener('submit', addTransaction);
    filterCategory.addEventListener('change', filterTransactions);
    searchInput.addEventListener('input', searchTransactions);
    exportBtn.addEventListener('click', exportToCSV);
});
