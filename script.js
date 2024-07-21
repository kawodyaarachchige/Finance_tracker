document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const filterCategory = document.getElementById('filter-category');
    const ctx = document.getElementById('myChart').getContext('2d');

    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let myChart;

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

    function addTransactionDOM(transaction) {
        const item = document.createElement('li');
        item.classList.add(transaction.category);
        item.innerHTML = `
            ${transaction.date} - ${transaction.description} - $${transaction.amount}
            <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
        `;
        transactionList.appendChild(item);
    }

    window.removeTransaction = function(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        init();
    };

    function generateID() {
        return Math.floor(Math.random() * 100000000);
    }

    function init() {
        transactionList.innerHTML = '';
        transactions.forEach(addTransactionDOM);
        updateSummary();
    }

    function filterTransactions() {
        const selectedCategory = filterCategory.value;
        transactionList.innerHTML = '';

        const filteredTransactions = selectedCategory === 'all'
            ? transactions
            : transactions.filter(transaction => transaction.category === selectedCategory);

        filteredTransactions.forEach(addTransactionDOM);
    }

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

    init();

    transactionForm.addEventListener('submit', addTransaction);
    filterCategory.addEventListener('change', filterTransactions);
});
