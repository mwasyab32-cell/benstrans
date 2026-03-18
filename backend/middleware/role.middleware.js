const checkRole = (roles) => {
    return (req, res, next) => {
        console.log('Checking role for user:', req.user);
        console.log('Required roles:', roles);
        
        if (!req.user) {
            console.log('No user in request');
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            console.log('Access denied for role:', req.user.role);
            return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
        }

        console.log('Role check passed');
        next();
    };
};

module.exports = { checkRole };