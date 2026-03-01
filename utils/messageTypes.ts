export const getTypeConfig = (cat: string): Record<string, { label: string; color: string; dot: string }> => {
    const normalizedCat = cat.toLowerCase()
    if (normalizedCat === 'debate') {
        return {
            claim: { label: 'Claim', color: 'bg-indigo-500', dot: 'bg-indigo-400' },
            evidence: { label: 'Evidence', color: 'bg-emerald-600', dot: 'bg-emerald-400' },
            counter: { label: 'Counter', color: 'bg-rose-600', dot: 'bg-rose-400' },
            concession: { label: 'Concession', color: 'bg-amber-500', dot: 'bg-amber-400' },
            synthesis: { label: 'Synthesis', color: 'bg-purple-600', dot: 'bg-purple-400' },
        }
    } else if (normalizedCat === 'learning') {
        return {
            concept: { label: 'Concept', color: 'bg-indigo-500', dot: 'bg-indigo-400' },
            question: { label: 'Question', color: 'bg-amber-500', dot: 'bg-amber-400' },
            analogy: { label: 'Analogy', color: 'bg-emerald-600', dot: 'bg-emerald-400' },
            example: { label: 'Example', color: 'bg-blue-500', dot: 'bg-blue-400' },
            summary: { label: 'Summary', color: 'bg-purple-600', dot: 'bg-purple-400' },
        }
    } else if (normalizedCat === 'dsa') {
        return {
            algorithm: { label: 'Algorithm', color: 'bg-indigo-500', dot: 'bg-indigo-400' },
            complexity: { label: 'Complexity', color: 'bg-amber-500', dot: 'bg-amber-400' },
            edge_case: { label: 'Edge Case', color: 'bg-rose-600', dot: 'bg-rose-400' },
            optimization: { label: 'Optimization', color: 'bg-emerald-600', dot: 'bg-emerald-400' },
            code_block: { label: 'Code Block', color: 'bg-slate-700', dot: 'bg-slate-500' },
        }
    }
    // General
    return {
        idea: { label: 'Idea', color: 'bg-indigo-500', dot: 'bg-indigo-400' },
        feedback: { label: 'Feedback', color: 'bg-emerald-600', dot: 'bg-emerald-400' },
        blocker: { label: 'Blocker', color: 'bg-rose-600', dot: 'bg-rose-400' },
        question: { label: 'Question', color: 'bg-amber-500', dot: 'bg-amber-400' },
        action_item: { label: 'Action Item', color: 'bg-blue-500', dot: 'bg-blue-400' },
    }
}
