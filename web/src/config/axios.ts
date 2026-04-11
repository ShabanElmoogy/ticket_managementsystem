// Global axios defaults — kept for backward compatibility only
// All new code should use src/services/api/base.ts
import axios from 'axios';

axios.defaults.timeout = 10000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export default axios;
