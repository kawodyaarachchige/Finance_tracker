document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const filterCategory = document.getElementById('filter-category');
    const searchInput = document.getElementById('search');
    const sortBySelect = document.getElementById('sort-by');
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

        document.getElementById('income').textContent = `Income: $${income.toFixed(2)}`;
        document.getElementById('expenses').textContent = `Expenses: $${expenses.toFixed(2)}`;
        document.getElementById('balance').textContent = `Balance: $${balance.toFixed(2)}`;
    }
    // Add a new transaction
    function addTransactionDOM(transaction) {
        const li = document.createElement('li');
        li.className = transaction.category;
        li.innerHTML = `
            <span>${transaction.date} - ${transaction.description}</span>
            <span>$${transaction.amount}</span>
            <button id="remove" data-id="${transaction.id}">Remove</button>
        `;
        transactionList.appendChild(li);
    }
// Render the transactions
    function renderTransactions(transactions) {
        transactionList.innerHTML = '';
        transactions.forEach(addTransactionDOM);
    }
// Update the chart
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
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += '$' + context.parsed.y;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });
    }
// Export to CSV and PDF
    function exportToCSV() {
        const csvRows = [];
        csvRows.push(['Date', 'Description', 'Amount', 'Category']);
        transactions.forEach(transaction => {
            csvRows.push([transaction.date, transaction.description, transaction.amount, transaction.category]);
        });
        const csvContent = csvRows.map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'transactions.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('Transaction History', 10, 10);
        transactions.forEach((transaction, index) => {
            doc.text(`${transaction.date} - ${transaction.description} - $${transaction.amount} - ${transaction.category}`, 10, 20 + index * 10);
        });
        doc.save('transactions.pdf');
    }

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;

        const newTransaction = {
            id: Date.now(),
            date,
            description,
            amount,
            category
        };

        transactions.push(newTransaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));

        addTransactionDOM(newTransaction);
        updateSummary();
        updateChart();
        transactionForm.reset();
    });

    transactionList.addEventListener('click', (e) => {
        if (e.target.id === 'remove') {
            const id = parseInt(e.target.dataset.id);
            transactions = transactions.filter(transaction => transaction.id !== id);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            renderTransactions(transactions);
            updateSummary();
            updateChart();
        }
    });

    filterCategory.addEventListener('change', () => {
        const category = filterCategory.value;
        let filteredTransactions = transactions;
        if (category !== 'all') {
            filteredTransactions = transactions.filter(transaction => transaction.category === category);
        }
        renderTransactions(filteredTransactions);
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filteredTransactions = transactions.filter(transaction =>
            transaction.description.toLowerCase().includes(query)
        );
        renderTransactions(filteredTransactions);
    });

    sortBySelect.addEventListener('change', () => {
        const criterion = sortBySelect.value;
        const sortedTransactions = [...transactions].sort((a, b) => {
            if (criterion === 'amount') {
                return parseFloat(a.amount) - parseFloat(b.amount);
            } else if (criterion === 'description') {
                return a.description.localeCompare(b.description);
            } else {
                return new Date(a.date) - new Date(b.date);
            }
        });
        renderTransactions(sortedTransactions);
    });

    exportBtn.addEventListener('click', () => {
        if (confirm('Export to CSV or PDF? Click OK for CSV, Cancel for PDF.')) {
            exportToCSV();
        } else {
            exportToPDF();
        }
    });

    modeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        modeToggle.querySelector('i').classList.toggle('fa-moon');
        modeToggle.querySelector('i').classList.toggle('fa-sun');
    });

    updateSummary();
    updateChart();
    renderTransactions(transactions);
});
