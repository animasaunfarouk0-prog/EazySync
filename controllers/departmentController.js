let departments = [
    { id: 1, name: "Engineering" },
    { id: 2, name: "Marketing" },
    { id: 3, name: "Sales" },
];

export const getDepartments = (req, res) => {
    res.json({ departments });
};

export const getDepartmentById = (req, res) => {
    const department = departments.find(dep => dep.id === parseInt(req.params.id));
    if (!department) {
        return res.status(404).json({ message: "Department not found" });
    }
    res.json({ department });
};

export const createDepartment = (req, res) => {
    const department = {
        id: departments.length + 1,
        name: req.body.name
    };
    departments.push(department);
    res.status(201).json({ message: "Department created successfully", department });
};

export const updateDepartment = (req, res) => {
    const department = departments.find(dep => dep.id === parseInt(req.params.id));
    if (!department) {
        return res.status(404).json({ message: "Department not found" });
    }
    Object.assign(department, req.body);
    res.status(200).json({ message: "Department updated successfully", department });
};

export const deleteDepartment = (req, res) => {
    departments = departments.filter(dep => dep.id !== parseInt(req.params.id));
    res.status(200).json({ message: "Department deleted successfully" });
};
