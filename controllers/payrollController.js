let payrolls = [];

export const getPayrolls = (req, res) => {
    res.status(200).json({ payrolls });
};

export const getPayrollById = (req, res) => {
    const payroll = payrolls.find(item => item.id === parseInt(req.params.id));
    if (!payroll) {
        return res.status(404).json({ message: "Payroll record not found" });
    }
    res.status(200).json({ payroll });
};

export const createPayroll = (req, res) => {
    const payroll = {
        id: payrolls.length + 1,
        employeeId: req.body.employeeId,
        salary: req.body.salary,
        bonus: req.body.bonus,
    };
    payrolls.push(payroll);
    res.status(201).json({ message: "Payroll record created successfully", payroll });
};

export const updatePayroll = (req, res) => {
    const payroll = payrolls.find(item => item.id === parseInt(req.params.id));
    if (!payroll) {
        return res.status(404).json({ message: "Payroll record not found" });
    }
    Object.assign(payroll, req.body);
    res.status(200).json({ message: "Payroll record updated successfully", payroll });
};

export const deletePayroll = (req, res) => {
    payrolls = payrolls.filter(item => item.id !== parseInt(req.params.id));
    res.status(200).json({ message: "Payroll record deleted successfully" });
};
