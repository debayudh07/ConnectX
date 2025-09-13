'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useBountyMarketplace, useTransactionStatus } from '../../../contractsABI/contractHooks';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../../../contractsABI/contractConfig';

export default function CreateBountiesPage() {
  const { address, isConnected } = useAccount();
  
  // Form state
  const [formData, setFormData] = useState({
    githubIssueUrl: '',
    repositoryUrl: '',
    description: '',
    reward: '0.1',
    deadline: '',
    skills: [] as string[],
    skillInput: '',
    difficultyLevel: '3'
  });

  // Contract hooks
  const { createBounty, hash, isPending, error } = useBountyMarketplace();
  const { isConfirming, isConfirmed } = useTransactionStatus(hash);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add skill to the list
  const addSkill = () => {
    if (formData.skillInput.trim() && !formData.skills.includes(formData.skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.skillInput.trim()],
        skillInput: ''
      }));
    }
  };

  // Remove skill from the list
  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!formData.githubIssueUrl || !formData.repositoryUrl || !formData.description || !formData.reward || !formData.deadline) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.skills.length === 0) {
      alert('Please add at least one skill requirement');
      return;
    }

    try {
      // Calculate deadline timestamp (convert date to Unix timestamp)
      const deadlineTimestamp = BigInt(Math.floor(new Date(formData.deadline).getTime() / 1000));
      
      // Create bounty parameters
      const bountyParams = {
        githubIssueUrl: formData.githubIssueUrl,
        repositoryUrl: formData.repositoryUrl,
        description: formData.description,
        deadline: deadlineTimestamp,
        requiredSkills: formData.skills,
        difficultyLevel: BigInt(formData.difficultyLevel),
        reward: parseEther(formData.reward)
      };

      await createBounty(bountyParams);
    } catch (err) {
      console.error('Error creating bounty:', err);
      alert('Error creating bounty. Check console for details.');
    }
  };

  // Reset form after successful transaction
  const resetForm = () => {
    setFormData({
      githubIssueUrl: '',
      repositoryUrl: '',
      description: '',
      reward: '0.1',
      deadline: '',
      skills: [],
      skillInput: '',
      difficultyLevel: '3'
    });
  };

  // If transaction is confirmed, show success and reset form
  if (isConfirmed) {
    setTimeout(() => {
      resetForm();
    }, 3000);
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Bounty</h1>
            <p className="text-gray-600 mb-6">Please connect your wallet to create a bounty</p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Network:</strong> {NETWORK_CONFIG.NETWORK_NAME}<br/>
                <strong>Chain ID:</strong> {NETWORK_CONFIG.CHAIN_ID}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Bounty</h1>
          
          {/* Success Message */}
          {isConfirmed && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Bounty Created Successfully!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your bounty has been created and is now live on the platform.</p>
                    <p className="mt-1">
                      <strong>Transaction:</strong>{' '}
                      <a 
                        href={`${NETWORK_CONFIG.BLOCK_EXPLORER}/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-green-600"
                      >
                        View on Explorer
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Creating Bounty</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* GitHub Issue URL */}
            <div>
              <label htmlFor="githubIssueUrl" className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Issue URL *
              </label>
              <input
                type="url"
                id="githubIssueUrl"
                name="githubIssueUrl"
                value={formData.githubIssueUrl}
                onChange={handleInputChange}
                placeholder="https://github.com/owner/repo/issues/123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Repository URL */}
            <div>
              <label htmlFor="repositoryUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Repository URL *
              </label>
              <input
                type="url"
                id="repositoryUrl"
                name="repositoryUrl"
                value={formData.repositoryUrl}
                onChange={handleInputChange}
                placeholder="https://github.com/owner/repo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Provide detailed requirements, specifications, and acceptance criteria..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Reward */}
            <div>
              <label htmlFor="reward" className="block text-sm font-medium text-gray-700 mb-2">
                Reward (AVAX) *
              </label>
              <input
                type="number"
                id="reward"
                name="reward"
                value={formData.reward}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                placeholder="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Minimum: 0.01 AVAX. This amount will be locked until bounty completion.
              </p>
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                Deadline *
              </label>
              <input
                type="datetime-local"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Skills Required */}
            <div>
              <label htmlFor="skillInput" className="block text-sm font-medium text-gray-700 mb-2">
                Skills Required *
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  id="skillInput"
                  name="skillInput"
                  value={formData.skillInput}
                  onChange={handleInputChange}
                  placeholder="e.g., React, TypeScript, Node.js"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>

              {/* Skills List */}
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Difficulty Level */}
            <div>
              <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level *
              </label>
              <select
                id="difficultyLevel"
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="1">1 - Beginner</option>
                <option value="2">2 - Easy</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - Hard</option>
                <option value="5">5 - Expert</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isPending || isConfirming ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isPending ? 'Creating Bounty...' : 'Confirming Transaction...'}
                  </div>
                ) : (
                  'Create Bounty'
                )}
              </button>
            </div>
          </form>

          {/* Network Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Network Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Network:</strong> {NETWORK_CONFIG.NETWORK_NAME}</p>
                <p><strong>Verifier Contract:</strong> {CONTRACT_ADDRESSES.SIMPLE_BOUNTY_VERIFIER}</p>
                <p><strong>Marketplace Contract:</strong> {CONTRACT_ADDRESSES.BOUNTY_MARKETPLACE}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}