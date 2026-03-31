# Performance Benchmarking Notes

## Baseline Metrics to Record

- Initial page load time
- Time to interactive
- Dashboard render time with sample data
- Search and filter response time
- Bundle size after production build

## Practical Method

1. Run production build: `npm run build`
2. Serve `dist/` and open browser DevTools
3. Use Lighthouse:
   - Performance
   - Best Practices
4. Record metrics with:
   - 100 records
   - 1000 records

## Current Observations (Template)

- Initial load: _TBD_
- Dashboard render (100 clients): _TBD_
- Dashboard render (1000 clients): _TBD_
- Bottlenecks: _TBD_

