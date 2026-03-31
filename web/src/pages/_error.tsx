import React from 'react';

function Error({ statusCode }: { statusCode: number }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '50px', textAlign: 'center' }}>
      <h1>{statusCode ? `An error ${statusCode} occurred on server` : 'An error occurred on client'}</h1>
      <p>Error in Rekono Platform</p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
