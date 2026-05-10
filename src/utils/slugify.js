const slugify = (text) => {
    return text
        .toLowerCase()
        .trim()                     // remove leading/trailing spaces first
        .replace(/\s+/g, '-')       // one or more spaces -> single hyphen
        .replace(/[^\w-]+/g, '')    // remove special characters
        .replace(/--+/g, '-')       // multiple hyphens -> single hyphen
        .replace(/^-+|-+$/g, '')    // remove leading/trailing hyphens
}

module.exports = slugify