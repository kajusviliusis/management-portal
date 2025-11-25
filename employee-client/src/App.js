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

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [token, setToken] = useState(null);

    const [regUsername, setRegUsername] = useState("");
    const [regPassword, setRegPassword] = useState("");


    useEffect(() => {
        if (token) fetchEmployees();
    }, [token]);

    const fetchEmployees = () => {

        if (!token) return;

        fetch("https://localhost:7021/api/employees", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error(err));
    };

    const handleLogin = (e) => {
        e.preventDefault();

        fetch("https://localhost:7021/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        })
            .then(res => {
                if (!res.ok) throw new Error("Invalid credentials");
                return res.json();
            })
            .then(data => {
                setToken(data.token);
                setUsername("");
                setPassword("");
            })
            .catch(err => alert(err.message));
    };

    const handleRegister = (e) => {
        e.preventDefault();

        fetch("https://localhost:7021/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: regUsername, password: regPassword })
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Registration failed");
                return data;
            })
            .then(data => {
                alert(data.message);
                setRegUsername("");
                setRegPassword("");
            })
            .catch(err => alert(err.message));
    };

    const addEmployee = (e) => {
        e.preventDefault();

        const newEmployee = { name, phone, email, salary: Number(salary) };

        fetch("https://localhost:7021/api/employees", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
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
        fetch(`https://localhost:7021/api/employees/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
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
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
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
        if (!token) return;
        const salaryValue = salary.trim() === "" ? null : Number(salary);

        if (!searchTerm.trim() && salaryValue === null) {
            fetch("https://localhost:7021/api/employees", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setEmployees(data))
                .catch(err => console.error(err));
            return;
        }

        const params = new URLSearchParams();
        if (searchTerm.trim() !== "") params.append("name", searchTerm.trim());
        if (salaryValue !== null) params.append("minSalary", salaryValue);
        if (sortOrder) params.append("sortOrder", sortOrder);

        fetch(`https://localhost:7021/api/employees/search?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error(err));
    };

    const uploadImage = (employeeId, file) =>
    {
        const formData = new FormData();
        formData.append('image', file);

        fetch(`https://localhost:7021/api/employees/${employeeId}/upload-image`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        })
            .then(res => {
                if (!res.ok) throw new Error('Upload failed');
                return res.json();
            })
            .then(data => {

                setEmployees(employees.map(emp =>
                    emp.id === employeeId
                        ? { ...emp, imagePath: data.imagePath }
                        : emp
                ));
                alert('Image uploaded successfully!');
            })
            .catch(err => {
                console.error(err);
                alert('Failed to upload image');
            });
    };

    const downloadCsv = async () => {
        if (!token) return;

        try {
            const response = await fetch("https://localhost:7021/api/employees/export", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "text/csv"
                }
            });

            if (!response.ok) throw new Error("Failed to download CSV");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert("CSV download failed");
        }
    };


    if (!token) {
        return (
            <div style={{ padding: 20 }}>
                <h1>Login</h1>
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Login</button>
                </form>

                <hr style={{ margin: "20px 0" }} />

                <h1>Register</h1>
                <form onSubmit={handleRegister}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={regUsername}
                        onChange={e => setRegUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Register</button>
                </form>
            </div>
        );
    }

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
                    handleSearch();
                }}>
                    <option value="asc">Salary Low → High</option>
                    <option value="desc">Salary High → Low</option>
                </select>
                <button
                    onClick={downloadCsv}
                    style={{ marginLeft: 10, backgroundColor: "#4CAF50", color: "white", padding: "5px 10px" }}
                >
                    Export CSV
                </button>
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
                        <th>Image</th>
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
                            <td>
                                {emp.imagePath ? (
                                    <img
                                        src={`https://localhost:7021${emp.imagePath}`}
                                        alt={emp.name}
                                        style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '50%' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 50,
                                        height: 50,
                                        backgroundColor: '#ddd',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {emp.name.charAt(0)}
                                    </div>
                                )}
                            </td>
                            <td>{emp.name}</td>
                            <td>{emp.phone}</td>
                            <td>{emp.email}</td>
                            <td>${emp.salary}</td>
                            <td>
                                <button onClick={() => startEdit(emp)}>Edit</button>
                                <button onClick={() => deleteEmployee(emp.id)}>Delete</button>

                                <input
                                    type="file"
                                    id={`file-${emp.id}`}
                                    accept="image/jpeg,image/png,image/jpg"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) uploadImage(emp.id, file);
                                    }}
                                />
                                <button onClick={() => document.getElementById(`file-${emp.id}`).click()}>
                                    Upload Photo
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {token && (
                <button
                    onClick={() => {
                        setToken(null);
                        localStorage.removeItem("token");
                        setEmployees([]);
                    }}
                    style={{ marginBottom: "20px" }}
                >
                    Logout
                </button>
            )}

        </div>
    );
}

export default App;
