let employees = [
    {
         id: 1, 
         name: "Kenny Roger", 
         email: "Kenny@example.com",
         department: "Engineering", 
         position: "Software Engineer" 
        },
        
    { 
        id: 2, 
        name: "Tommy Hilfiger", 
        email: "Tommy@example.com", 
        department: "Marketing", 
        position: "Product Manager" 
     },
];

export const getEmployees = (req, res) => {
    res.status(200).json({ employees });
};
export const getEmployeeById = (req, res) => {
    const employee = employees.find(emp => emp.id === parseInt(req.params.id));
    if (!employee) {
        return 
        res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ employee });
};  

export const createEmployee = (req, res) => {
    const employee = {
        id: employees.length + 1,
        name: req.body.name,
        email: req.body.email,
        department: req.body.department,
        position: req.body.position
    }
    employees.push(employee);
    res.status(201).json({ message: "Employee created successfully", employee });
};

export const updateEmployee = (req, res) => {
    const employee = employees.find(emp => emp.id === parseInt(req.params.id)); 
    if (!employee) {
        return 
        res.status(404).json({ message: "Employee not found" });
    }
    Object.assign(employee, req.body);
    res.status(200).json({ message: "Employee updated successfully", employee });
};

export const deleteEmployee = (req, res) => {
    employees = employees.filter(emp => emp.id !== parseInt(req.params.id));
    res.status(200).json({ message: "Employee deleted successfully" });
}
