import { useEffect, useState } from "react";

function App() {
    const [employees, setEmployees] = useState([]);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [salary, setSalary] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");

    useEffect(() => {
        fetch("https://localhost:7021/api/employees")
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error(err));
    }, []);

    const addEmployee = (e) => {
        e.preventDefault();

        const newEmployee = { name, phone, email, salary: Number(salary) };

        fetch("https://localhost:7021/api/employees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEmployee)
        })
            .then(res => res.json())
            .then(createdEmployee => {
                setEmployees([...employees, createdEmployee]);
                setName(""); setPhone(""); setEmail(""); setSalary("");
            })
            .catch(err => console.error(err));
    };

    const deleteEmployee = (id) => {
        fetch(`https://localhost:7021/api/employees/${id}`, { method: "DELETE" })
            .then(() => setEmployees(employees.filter(emp => emp.id !== id)))
            .catch(err => console.error(err));
    };

    const startEdit = (emp) => {
        setEditingId(emp.id);
        setName(emp.name);
        setPhone(emp.phone);
        setEmail(emp.email);
        setSalary(emp.salary);
    };

    const saveEdit = (e) => {
        e.preventDefault();

        const updatedEmployee = { id: editingId, name, phone, email, salary: Number(salary) };

        fetch(`https://localhost:7021/api/employees/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedEmployee)
        })
            .then(() => {
                setEmployees(employees.map(emp => emp.id === editingId ? updatedEmployee : emp));
                setEditingId(null);
                setName(""); setPhone(""); setEmail(""); setSalary("");
            })
            .catch(err => console.error(err));
    };

    const handleSearch = () => {
        const salaryValue = salary.trim() === "" ? null : Number(salary);

        if (!searchTerm.trim() && salaryValue === null) {
            fetch("https://localhost:7021/api/employees")
                .then(res => res.json())
                .then(data => setEmployees(data))
                .catch(err => console.error(err));
            return;
        }

        const params = new URLSearchParams();

        if (searchTerm.trim() !== "") params.append("name", searchTerm.trim());
        if (salaryValue !== null) params.append("minSalary", salaryValue);
        if (sortOrder) params.append("sortOrder", sortOrder);

        fetch(`https://localhost:7021/api/employees/search?${params.toString()}`)
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error(err));
    };



    return (
        <div style={{ padding: 20 }}>
            <h1>Employees</h1>

            <div style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={handleSearch}>Search</button>

                <select value={sortOrder} onChange={(e) => {
                    const newOrder = e.target.value;
                    setSortOrder(newOrder);
                    handleSearch(newOrder);
                
                }}>
                    <option value="asc">Salary Low → High</option>
                    <option value="desc">Salary High → Low</option>
                </select>


            </div>

            <form onSubmit={editingId ? saveEdit : addEmployee} style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Salary"
                    value={salary}
                    onChange={e => setSalary(e.target.value)}
                    required
                />
                <button type="submit">{editingId ? "Save" : "Add Employee"}</button>
            </form>

            <table border="1" cellPadding="5">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Salary</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(emp => (
                        <tr key={emp.id}>
                            <td>{emp.name}</td>
                            <td>{emp.phone}</td>
                            <td>{emp.email}</td>
                            <td>${emp.salary}</td>
                            <td>
                                <button onClick={() => startEdit(emp)}>Edit</button>
                                <button onClick={() => deleteEmployee(emp.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default App;
