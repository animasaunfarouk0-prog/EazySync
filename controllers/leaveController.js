let leaveRequests = [];
export const getLeaveRequests = (req, res) => {
    res.status(200).json({ leaveRequests });
};

export const getLeaveRequestById = (req, res) => {
    const leave = leaveRequests.find(item => item.id === parseInt(req.params.id));
    if (!leave) {
        return res.status(404).json({ message: "Leave request not found" });
    }
    res.status(200).json({ leave });    
};

export const createLeaveRequest = (req, res) => {       
    const leave = {
        id: leaveRequests.length + 1,
        employeeId: req.body.employeeId,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        status: req.body.status
    };
    leaveRequests.push(leave);
    res.status(201).json({ message: "Leave request created successfully", leave });
};
    export const updateLeaveRequest = (req, res) => {
        const leave = leaveRequests.find(item => item.id === parseInt(req.params.id));
        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }   
    Object.assign(leave, req.body);
    res.status(200).json({ message: "Leave request updated successfully", leave });
};

export const deleteLeaveRequest = (req, res) => {
    leaveRequests = leaveRequests.filter(item => item.id !== parseInt(req.params.id));
    res.status(200).json({ message: "Leave request deleted successfully" });
};
