let attendance = [];
export const getAttendanceRecords = (req, res) => {
    res.status(200).json({ attendance });
};
export const getAttendanceRecordById = (req, res) => {
    const record = attendance.find(item => item.id === parseInt(req.params.id));
    if (!record) {
        return res.status(404).json({ message: "Attendance record not found" });
    }
    res.status(200).json({ record });
};
export const createAttendanceRecord = (req, res) => {
    const record = {
        id: attendance.length + 1,
        employeeId: req.body.employeeId,
        date: req.body.date,
        status: req.body.status
    };
    attendance.push(record);
    res.status(201).json({ message: "Attendance record created successfully", record });
};

export const updateAttendanceRecord = (req, res) => {
    const record = attendance.find(item => item.id === parseInt(req.params.id));
    if (!record) {
        return res.status(404).json({ message: "Attendance record not found" });
    }
    Object.assign(record, req.body);
    res.status(200).json({ message: "Attendance record updated successfully", record });
};

export const deleteAttendanceRecord = (req, res) => {
    attendance = attendance.filter(item => item.id !== parseInt(req.params.id));
    res.status(200).json({ message: "Attendance record deleted successfully" });
};
