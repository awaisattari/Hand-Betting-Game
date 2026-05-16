const { composePlugins, withNx } = require('@nx/webpack');

// Nx default Node webpack pipeline — left as a single composePlugins call
// so it's easy to add e.g. withSentry / withProm in a follow-up.
module.exports = composePlugins(withNx(), (config) => config);
