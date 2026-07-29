let applicants = [];

export const getApplicants = (req, res) => {
    res.status(200).json({ applicants });
};  

export const getApplicantById = (req, res) => {
    const applicant = applicants.find(item => item.id === parseInt(req.params.id));
    if (!applicant) {
        return res.status(404).json({ message: "Applicant not found" });
    }
    res.status(200).json({ applicant });
};  

export const createApplicant = (req, res) => {
    const applicant = {
        id: applicants.length + 1,
        name: req.body.name,
        position: req.body.position,
        status: req.body.status
    };
    applicants.push(applicant);
    res.status(201).json({ message: "Applicant created successfully", applicant });
};  

export const updateApplicant = (req, res) => {
    const applicant = applicants.find(item => item.id === parseInt(req.params.id));
    if (!applicant) {
        return res.status(404).json({ message: "Applicant not found" });
    }
    Object.assign(applicant, req.body);
    res.status(200).json({ message: "Applicant updated successfully", applicant });
};  

export const deleteApplicant = (req, res) => {
    applicants = applicants.filter(item => item.id !== parseInt(req.params.id));
    res.status(200).json({ message: "Applicant deleted successfully" });
};
